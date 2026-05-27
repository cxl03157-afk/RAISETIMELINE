package com.raisetimeline.service;

import com.raisetimeline.dto.request.CreatePostRequest;
import com.raisetimeline.dto.response.PostResponse;
import com.raisetimeline.entity.Post;
import com.raisetimeline.entity.PostImage;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.BadRequestException;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.repository.LikeRepository;
import com.raisetimeline.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserService userService;
    private final LikeRepository likeRepository;
    private final S3Service s3Service;

    @Transactional(readOnly = true)
    public Page<PostResponse> getTimeline(String email, int page, int size) {
        Page<Post> posts = postRepository.findAllWithUser(PageRequest.of(page, size));
        Set<Long> likedIds = getLikedPostIds(email, posts.getContent());
        return posts.map(p -> toResponse(p, likedIds.contains(p.getId())));
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getFollowingTimeline(String email, int page, int size) {
        User user = userService.getByEmail(email);
        Page<Post> posts = postRepository.findFollowingPosts(user.getId(), PageRequest.of(page, size));
        Set<Long> likedIds = getLikedPostIds(email, posts.getContent());
        return posts.map(p -> toResponse(p, likedIds.contains(p.getId())));
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getUserPosts(String username, String email) {
        List<Post> posts = postRepository.findByUsernameWithImages(username);
        Set<Long> likedIds = getLikedPostIds(email, posts);
        return posts.stream().map(p -> toResponse(p, likedIds.contains(p.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public PostResponse getPost(String email, Long postId) {
        Post post = findById(postId);
        boolean liked = likeRepository.existsByPostIdAndUserEmail(postId, email);
        return toResponse(post, liked);
    }

    @Transactional
    public PostResponse create(String email, String content, List<MultipartFile> images) {
        boolean hasContent = content != null && !content.isBlank();
        boolean hasImages  = images != null && !images.isEmpty();

        if (!hasContent && !hasImages) {
            throw new BadRequestException("本文または画像が必要です");
        }
        if (content != null && content.length() > 280) {
            throw new BadRequestException("本文は280文字以内で入力してください");
        }

        validateImages(images);

        // 空白のみの content は "" に正規化して DB 保存
        String safeContent = hasContent ? content : "";
        User user = userService.getByEmail(email);

        // Post を先に保存して ID を確定させてから、S3 key に postId を含める
        // cascade = CascadeType.ALL により、@Transactional コミット時に PostImage が自動保存される
        Post post = postRepository.save(Post.builder().user(user).content(safeContent).build());

        List<String> uploadedKeys = new ArrayList<>();
        try {
            if (hasImages) {
                for (int i = 0; i < images.size(); i++) {
                    MultipartFile file = images.get(i);
                    String ext = resolveExtension(file.getContentType());
                    String key = "posts/" + post.getId() + "/" + UUID.randomUUID() + ext;
                    s3Service.upload(file, key);
                    uploadedKeys.add(key);
                    post.getImages().add(PostImage.builder()
                            .post(post)
                            .imageKey(key)
                            .displayOrder(i)
                            .build());
                }
            }
        } catch (Exception e) {
            // 補償処理: アップロード済み S3 オブジェクトを削除
            uploadedKeys.forEach(s3Service::delete);
            throw e;
        }

        log.info("Post created: postId={} username={}", post.getId(), user.getUsername());
        return toResponse(post, false);
    }

    @Transactional
    public PostResponse update(String email, Long postId, CreatePostRequest req) {
        Post post = findById(postId);
        checkAuthor(post, email);
        post.setContent(req.getContent());
        post.setUpdatedAt(LocalDateTime.now());
        boolean liked = likeRepository.existsByPostIdAndUserEmail(postId, email);
        return toResponse(post, liked);
    }

    @Transactional
    public void delete(String email, Long postId) {
        Post post = findById(postId);
        checkAuthor(post, email);
        // S3 連動削除（失敗はログのみ・DB 削除は継続）
        post.getImages().forEach(img -> s3Service.delete(img.getImageKey()));
        postRepository.delete(post);
        log.info("Post deleted: postId={} username={}", postId, email);
    }

    private PostResponse toResponse(Post post, boolean likedByCurrentUser) {
        List<String> imageUrls = post.getImages().stream()
                .map(img -> s3Service.generatePresignedUrl(img.getImageKey()))
                .toList();
        String userAvatarUrl = post.getUser().getAvatarKey() != null
                ? s3Service.generatePresignedUrl(post.getUser().getAvatarKey())
                : null;
        return new PostResponse(post, likedByCurrentUser, imageUrls, userAvatarUrl);
    }

    private void validateImages(List<MultipartFile> images) {
        if (images == null || images.isEmpty()) return;
        if (images.size() > 4) {
            throw new BadRequestException("画像は最大4枚まで添付できます");
        }
        for (MultipartFile f : images) {
            if (f.isEmpty()) {
                throw new BadRequestException("空ファイルは添付できません");
            }
            if (f.getSize() > 10L * 1024 * 1024) {
                throw new BadRequestException("画像は1枚あたり10MB以内にしてください");
            }
            String ct = f.getContentType();
            if (!"image/jpeg".equals(ct) && !"image/png".equals(ct)) {
                throw new BadRequestException("JPEG または PNG 形式の画像のみ添付できます");
            }
        }
    }

    private String resolveExtension(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png"  -> ".png";
            default -> throw new BadRequestException("対応していない画像形式です");
        };
    }

    private Post findById(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("投稿が見つかりません: " + postId));
    }

    private void checkAuthor(Post post, String email) {
        if (!post.getUser().getEmail().equals(email)) {
            throw new ForbiddenException("この操作は投稿者のみ実行できます");
        }
    }

    private Set<Long> getLikedPostIds(String email, List<Post> posts) {
        List<Long> ids = posts.stream().map(Post::getId).toList();
        if (ids.isEmpty()) return Set.of();
        return likeRepository.findLikedPostIdsByEmail(email, ids);
    }
}
