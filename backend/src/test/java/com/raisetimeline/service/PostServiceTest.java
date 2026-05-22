package com.raisetimeline.service;

import com.raisetimeline.dto.request.CreatePostRequest;
import com.raisetimeline.dto.response.PostResponse;
import com.raisetimeline.entity.Post;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.BadRequestException;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.repository.LikeRepository;
import com.raisetimeline.repository.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock PostRepository postRepository;
    @Mock UserService userService;
    @Mock LikeRepository likeRepository;
    @Mock S3Service s3Service;

    @InjectMocks PostService postService;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = User.builder().id(1L).email("alice@example.com").username("alice").displayName("Alice").build();
        bob   = User.builder().id(2L).email("bob@example.com").username("bob").displayName("Bob").build();
    }

    // ─── create ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("正常作成: テキストのみ投稿")
    void create_text_only_success() {
        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(postRepository.save(any())).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        PostResponse res = postService.create("alice@example.com", "Hello World", null);

        assertThat(res.getContent()).isEqualTo("Hello World");
        assertThat(res.getUser().getUsername()).isEqualTo("alice");
        assertThat(res.getImageUrls()).isEmpty();
        verify(postRepository).save(any());
        verify(s3Service, never()).upload(any(), any());
    }

    @Test
    @DisplayName("正常作成: 画像のみ投稿（content 空）")
    void create_image_only_success() {
        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(postRepository.save(any())).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(s3Service.generatePresignedUrl(any())).thenReturn("https://s3.example.com/signed");

        MockMultipartFile file = new MockMultipartFile(
                "images", "photo.jpg", "image/jpeg", new byte[100]);

        PostResponse res = postService.create("alice@example.com", null, List.of(file));

        assertThat(res.getContent()).isEqualTo("");
        verify(s3Service).upload(eq(file), anyString());
    }

    @Test
    @DisplayName("バリデーション: 本文なし + 画像なし → BadRequestException")
    void create_no_content_no_image_throws() {
        assertThatThrownBy(() -> postService.create("alice@example.com", null, null))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> postService.create("alice@example.com", "  ", null))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("バリデーション: 本文 281 文字 → BadRequestException")
    void create_content_too_long_throws() {
        String longContent = "あ".repeat(281);
        assertThatThrownBy(() -> postService.create("alice@example.com", longContent, null))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("バリデーション: 画像 5 枚 → BadRequestException")
    void create_too_many_images_throws() {
        List<MultipartFile> files = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            files.add(new MockMultipartFile("images", "photo.jpg", "image/jpeg", new byte[100]));
        }
        assertThatThrownBy(() -> postService.create("alice@example.com", "text", files))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("4枚");
    }

    @Test
    @DisplayName("バリデーション: JPEG/PNG 以外 → BadRequestException")
    void create_invalid_image_type_throws() {
        MockMultipartFile gifFile = new MockMultipartFile(
                "images", "anim.gif", "image/gif", new byte[100]);
        assertThatThrownBy(() -> postService.create("alice@example.com", "text", List.of(gifFile)))
                .isInstanceOf(BadRequestException.class);
    }

    // ─── update ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("投稿編集: 作者本人なら内容が更新される")
    void update_success() {
        Post post = Post.builder().id(1L).user(alice).content("old").build();
        CreatePostRequest req = new CreatePostRequest();
        req.setContent("new content");

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        PostResponse res = postService.update("alice@example.com", 1L, req);

        assertThat(res.getContent()).isEqualTo("new content");
    }

    @Test
    @DisplayName("投稿編集: 他人の投稿は ForbiddenException")
    void update_forbidden() {
        Post post = Post.builder().id(1L).user(alice).content("old").build();
        CreatePostRequest req = new CreatePostRequest();
        req.setContent("hack");

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> postService.update("bob@example.com", 1L, req))
                .isInstanceOf(ForbiddenException.class);
    }

    // ─── delete ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("投稿削除: 作者本人なら削除される（画像なし）")
    void delete_success() {
        Post post = Post.builder().id(1L).user(alice).content("bye").build();

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        postService.delete("alice@example.com", 1L);

        verify(postRepository).delete(post);
        verify(s3Service, never()).delete(any());
    }

    @Test
    @DisplayName("投稿削除: 他人の投稿は ForbiddenException")
    void delete_forbidden() {
        Post post = Post.builder().id(1L).user(alice).content("bye").build();

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> postService.delete("bob@example.com", 1L))
                .isInstanceOf(ForbiddenException.class);
        verify(postRepository, never()).delete(any());
    }

    // ─── getPost ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("存在しない投稿: ResourceNotFoundException")
    void getPost_notFound() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.getPost("alice@example.com", 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
