package com.raisetimeline.service;

import com.raisetimeline.entity.Like;
import com.raisetimeline.entity.Post;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.DuplicateException;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LikeServiceTest {

    @Mock LikeRepository likeRepository;
    @Mock PostRepository postRepository;
    @Mock UserService userService;

    @InjectMocks LikeService likeService;

    private User alice;
    private Post post;

    @BeforeEach
    void setUp() {
        alice = User.builder().id(1L).email("alice@example.com").username("alice").displayName("Alice").build();
        post  = Post.builder().id(1L).user(alice).content("Hello").build();
    }

    @Test
    @DisplayName("正常いいね: Like が保存される")
    void like_success() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(likeRepository.existsByPostIdAndUserId(1L, 1L)).thenReturn(false);

        likeService.like("alice@example.com", 1L);

        verify(likeRepository).save(any());
    }

    @Test
    @DisplayName("重複いいね: DuplicateException が発生する")
    void like_duplicate() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(likeRepository.existsByPostIdAndUserId(1L, 1L)).thenReturn(true);

        assertThatThrownBy(() -> likeService.like("alice@example.com", 1L))
                .isInstanceOf(DuplicateException.class);
        verify(likeRepository, never()).save(any());
    }

    @Test
    @DisplayName("正常いいね取り消し: Like が削除される")
    void unlike_success() {
        Like like = Like.builder().id(1L).post(post).user(alice).build();

        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(likeRepository.findByPostIdAndUserId(1L, 1L)).thenReturn(Optional.of(like));

        likeService.unlike("alice@example.com", 1L);

        verify(likeRepository).delete(like);
    }

    @Test
    @DisplayName("いいねしていない投稿の取り消し: ResourceNotFoundException")
    void unlike_notFound() {
        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(likeRepository.findByPostIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> likeService.unlike("alice@example.com", 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("存在しない投稿へのいいね: ResourceNotFoundException")
    void like_postNotFound() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> likeService.like("alice@example.com", 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
