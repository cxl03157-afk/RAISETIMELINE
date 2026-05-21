package com.raisetimeline.service;

import com.raisetimeline.entity.Follow;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.BadRequestException;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.repository.FollowRepository;
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
class FollowServiceTest {

    @Mock FollowRepository followRepository;
    @Mock UserService userService;

    @InjectMocks FollowService followService;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = User.builder().id(1L).email("alice@example.com").username("alice").displayName("Alice").build();
        bob   = User.builder().id(2L).email("bob@example.com").username("bob").displayName("Bob").build();
    }

    @Test
    @DisplayName("フォロー成功: Follow エンティティが保存される")
    void follow_success() {
        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(userService.getByUsername("bob")).thenReturn(bob);
        when(followRepository.existsByFollowerIdAndFolloweeId(1L, 2L)).thenReturn(false);

        followService.follow("alice@example.com", "bob");

        verify(followRepository).save(any(Follow.class));
    }

    @Test
    @DisplayName("自己フォロー: BadRequestException(400)")
    void follow_selfFollow_throwsBadRequest() {
        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(userService.getByUsername("alice")).thenReturn(alice);

        assertThatThrownBy(() -> followService.follow("alice@example.com", "alice"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("自分自身");
        verify(followRepository, never()).save(any());
    }

    @Test
    @DisplayName("重複フォロー: BadRequestException(400)")
    void follow_duplicate_throwsBadRequest() {
        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(userService.getByUsername("bob")).thenReturn(bob);
        when(followRepository.existsByFollowerIdAndFolloweeId(1L, 2L)).thenReturn(true);

        assertThatThrownBy(() -> followService.follow("alice@example.com", "bob"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("フォロー済み");
        verify(followRepository, never()).save(any());
    }

    @Test
    @DisplayName("存在しないユーザーへのフォロー: ResourceNotFoundException(404)")
    void follow_userNotFound_throwsNotFound() {
        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(userService.getByUsername("ghost")).thenThrow(new ResourceNotFoundException("ユーザーが見つかりません: ghost"));

        assertThatThrownBy(() -> followService.follow("alice@example.com", "ghost"))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(followRepository, never()).save(any());
    }

    @Test
    @DisplayName("アンフォロー成功: Follow エンティティが削除される")
    void unfollow_success() {
        Follow follow = Follow.builder().id(10L).follower(alice).followee(bob).build();
        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(userService.getByUsername("bob")).thenReturn(bob);
        when(followRepository.findByFollowerIdAndFolloweeId(1L, 2L)).thenReturn(Optional.of(follow));

        followService.unfollow("alice@example.com", "bob");

        verify(followRepository).delete(follow);
    }

    @Test
    @DisplayName("フォローしていないのにアンフォロー: ResourceNotFoundException(404)")
    void unfollow_notFollowing_throwsNotFound() {
        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(userService.getByUsername("bob")).thenReturn(bob);
        when(followRepository.findByFollowerIdAndFolloweeId(1L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> followService.unfollow("alice@example.com", "bob"))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(followRepository, never()).delete(any());
    }
}
