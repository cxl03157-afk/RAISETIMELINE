package com.raisetimeline.service;

import com.raisetimeline.dto.request.CreatePostRequest;
import com.raisetimeline.dto.response.PostResponse;
import com.raisetimeline.entity.Post;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.repository.LikeRepository;
import com.raisetimeline.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserService userService;
    private final LikeRepository likeRepository;

    @Transactional(readOnly = true)
    public Page<PostResponse> getTimeline(String email, int page, int size) {
        Page<Post> posts = postRepository.findAllWithUser(PageRequest.of(page, size));
        Set<Long> likedIds = getLikedPostIds(email, posts.getContent());
        return posts.map(p -> new PostResponse(p, likedIds.contains(p.getId())));
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getFollowingTimeline(String email, int page, int size) {
        User user = userService.getByEmail(email);
        Page<Post> posts = postRepository.findFollowingPosts(user.getId(), PageRequest.of(page, size));
        Set<Long> likedIds = getLikedPostIds(email, posts.getContent());
        return posts.map(p -> new PostResponse(p, likedIds.contains(p.getId())));
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getUserPosts(String username) {
        return postRepository.findByUsernameWithImages(username).stream()
                .map(PostResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public PostResponse getPost(String email, Long postId) {
        Post post = findById(postId);
        boolean liked = likeRepository.existsByPostIdAndUserEmail(postId, email);
        return new PostResponse(post, liked);
    }

    @Transactional
    public PostResponse create(String email, CreatePostRequest req) {
        User user = userService.getByEmail(email);
        Post post = Post.builder()
                .user(user)
                .content(req.getContent())
                .build();
        return new PostResponse(postRepository.save(post));
    }

    @Transactional
    public PostResponse update(String email, Long postId, CreatePostRequest req) {
        Post post = findById(postId);
        checkAuthor(post, email);
        post.setContent(req.getContent());
        post.setUpdatedAt(LocalDateTime.now());
        boolean liked = likeRepository.existsByPostIdAndUserEmail(postId, email);
        return new PostResponse(post, liked);
    }

    @Transactional
    public void delete(String email, Long postId) {
        Post post = findById(postId);
        checkAuthor(post, email);
        postRepository.delete(post);
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
