package com.raisetimeline.service;

import com.raisetimeline.dto.request.CreatePostRequest;
import com.raisetimeline.dto.response.PostResponse;
import com.raisetimeline.entity.Post;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.repository.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock PostRepository postRepository;
    @Mock UserService userService;

    @InjectMocks PostService postService;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = User.builder().id(1L).email("alice@example.com").username("alice").displayName("Alice").build();
        bob   = User.builder().id(2L).email("bob@example.com").username("bob").displayName("Bob").build();
    }

    @Test
    @DisplayName("正常作成: 投稿が保存されレスポンスが返る")
    void create_success() {
        CreatePostRequest req = new CreatePostRequest();
        req.setContent("Hello World");

        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(postRepository.save(any())).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        PostResponse res = postService.create("alice@example.com", req);

        assertThat(res.getContent()).isEqualTo("Hello World");
        assertThat(res.getUser().getUsername()).isEqualTo("alice");
        verify(postRepository).save(any());
    }

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

    @Test
    @DisplayName("投稿削除: 作者本人なら削除される")
    void delete_success() {
        Post post = Post.builder().id(1L).user(alice).content("bye").build();

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        postService.delete("alice@example.com", 1L);

        verify(postRepository).delete(post);
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

    @Test
    @DisplayName("存在しない投稿: ResourceNotFoundException")
    void getPost_notFound() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.getPost(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
