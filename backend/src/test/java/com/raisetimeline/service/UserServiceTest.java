package com.raisetimeline.service;

import com.raisetimeline.dto.request.UpdateProfileRequest;
import com.raisetimeline.dto.response.UserResponse;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.BadRequestException;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.repository.FollowRepository;
import com.raisetimeline.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock FollowRepository followRepository;
    @Mock S3Service s3Service;

    @InjectMocks UserService userService;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = User.builder().id(1L).email("alice@example.com").username("alice").displayName("Alice").build();
        bob   = User.builder().id(2L).email("bob@example.com").username("bob").displayName("Bob").build();
    }

    // ─── getProfile ───────────────────────────────────────────────────────

    @Test
    @DisplayName("getProfile: 正常系 — ユーザーが存在する場合レスポンスを返す")
    void getProfile_success() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(bob));
        when(followRepository.countByFollowerId(alice.getId())).thenReturn(5L);
        when(followRepository.countByFolloweeId(alice.getId())).thenReturn(10L);
        when(followRepository.existsByFollowerIdAndFolloweeId(bob.getId(), alice.getId())).thenReturn(false);

        UserResponse res = userService.getProfile("alice", "bob@example.com");

        assertThat(res.getUsername()).isEqualTo("alice");
        assertThat(res.getFollowingCount()).isEqualTo(5L);
        assertThat(res.getFollowersCount()).isEqualTo(10L);
    }

    @Test
    @DisplayName("getProfile: 存在しないユーザー名 — ResourceNotFoundException")
    void getProfile_userNotFound() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getProfile("ghost", "alice@example.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── updateProfile ────────────────────────────────────────────────────

    @Test
    @DisplayName("updateProfile: 表示名1文字（下限境界値）— 正常")
    void updateProfile_displayName_1char_success() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
        when(followRepository.countByFollowerId(anyLong())).thenReturn(0L);
        when(followRepository.countByFolloweeId(anyLong())).thenReturn(0L);

        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setDisplayName("A");
        req.setBio("");

        UserResponse res = userService.updateProfile("alice@example.com", req);

        assertThat(res.getDisplayName()).isEqualTo("A");
    }

    @Test
    @DisplayName("updateProfile: 表示名50文字（上限境界値）— 正常")
    void updateProfile_displayName_50chars_success() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
        when(followRepository.countByFollowerId(anyLong())).thenReturn(0L);
        when(followRepository.countByFolloweeId(anyLong())).thenReturn(0L);

        String name50 = "あ".repeat(50);
        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setDisplayName(name50);

        UserResponse res = userService.updateProfile("alice@example.com", req);

        assertThat(res.getDisplayName()).isEqualTo(name50);
    }

    // ─── uploadAvatar ─────────────────────────────────────────────────────

    @Test
    @DisplayName("uploadAvatar: JPEG ファイル — 正常")
    void uploadAvatar_jpeg_success() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
        when(userRepository.save(any())).thenReturn(alice);
        when(followRepository.countByFollowerId(anyLong())).thenReturn(0L);
        when(followRepository.countByFolloweeId(anyLong())).thenReturn(0L);

        MockMultipartFile jpeg = new MockMultipartFile(
                "avatar", "photo.jpg", "image/jpeg", new byte[100]);

        userService.uploadAvatar("alice@example.com", jpeg);

        verify(s3Service).upload(eq(jpeg), anyString());
    }

    @Test
    @DisplayName("uploadAvatar: PNG ファイル — 正常")
    void uploadAvatar_png_success() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
        when(userRepository.save(any())).thenReturn(alice);
        when(followRepository.countByFollowerId(anyLong())).thenReturn(0L);
        when(followRepository.countByFolloweeId(anyLong())).thenReturn(0L);

        MockMultipartFile png = new MockMultipartFile(
                "avatar", "photo.png", "image/png", new byte[100]);

        userService.uploadAvatar("alice@example.com", png);

        verify(s3Service).upload(eq(png), anyString());
    }

    @Test
    @DisplayName("uploadAvatar: GIF ファイル（無効形式）— BadRequestException")
    void uploadAvatar_gif_throws() {
        MockMultipartFile gif = new MockMultipartFile(
                "avatar", "anim.gif", "image/gif", new byte[100]);

        assertThatThrownBy(() -> userService.uploadAvatar("alice@example.com", gif))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("JPEG");
    }

    @Test
    @DisplayName("uploadAvatar: 空ファイル — BadRequestException")
    void uploadAvatar_empty_throws() {
        MockMultipartFile empty = new MockMultipartFile(
                "avatar", "photo.jpg", "image/jpeg", new byte[0]);

        assertThatThrownBy(() -> userService.uploadAvatar("alice@example.com", empty))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("uploadAvatar: 5MB ちょうど（上限境界値）— 正常")
    void uploadAvatar_exactly5MB_success() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
        when(userRepository.save(any())).thenReturn(alice);
        when(followRepository.countByFollowerId(anyLong())).thenReturn(0L);
        when(followRepository.countByFolloweeId(anyLong())).thenReturn(0L);

        byte[] data = new byte[5 * 1024 * 1024]; // 5MB ちょうど
        MockMultipartFile file = new MockMultipartFile(
                "avatar", "photo.jpg", "image/jpeg", data);

        userService.uploadAvatar("alice@example.com", file);

        verify(s3Service).upload(any(), anyString());
    }

    @Test
    @DisplayName("uploadAvatar: 5MB 超（上限超え境界値）— BadRequestException")
    void uploadAvatar_over5MB_throws() {
        byte[] data = new byte[5 * 1024 * 1024 + 1]; // 5MB + 1byte
        MockMultipartFile file = new MockMultipartFile(
                "avatar", "photo.jpg", "image/jpeg", data);

        assertThatThrownBy(() -> userService.uploadAvatar("alice@example.com", file))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("5MB");
    }

    // ─── searchUsers ──────────────────────────────────────────────────────

    @Test
    @DisplayName("searchUsers: 空キーワード — 空リストを返す")
    void searchUsers_blankKeyword_returnsEmpty() {
        List<UserResponse> result = userService.searchUsers("", "alice@example.com");

        assertThat(result).isEmpty();
        verify(userRepository, never()).searchByKeyword(any(), any(), any());
    }

    @Test
    @DisplayName("searchUsers: null キーワード — 空リストを返す")
    void searchUsers_nullKeyword_returnsEmpty() {
        List<UserResponse> result = userService.searchUsers(null, "alice@example.com");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("searchUsers: キーワード一致 — 結果を返す（自分を除外）")
    void searchUsers_keyword_excludesSelf() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
        when(userRepository.searchByKeyword(eq("bob"), eq(alice.getId()), any()))
                .thenReturn(List.of(bob));
        when(followRepository.findFollowedUserIds(eq(alice.getId()), any())).thenReturn(java.util.Set.of());
        when(followRepository.countFollowingByUserIds(any())).thenReturn(List.of());
        when(followRepository.countFollowersByUserIds(any())).thenReturn(List.of());

        List<UserResponse> result = userService.searchUsers("bob", "alice@example.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUsername()).isEqualTo("bob");
    }
}
