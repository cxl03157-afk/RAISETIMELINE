package com.raisetimeline.service;

import com.raisetimeline.entity.RefreshToken;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.UnauthorizedException;
import com.raisetimeline.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock RefreshTokenRepository refreshTokenRepository;

    @InjectMocks RefreshTokenService refreshTokenService;

    private User alice;

    @BeforeEach
    void setUp() {
        alice = User.builder().id(1L).email("alice@example.com").username("alice").displayName("Alice").build();
        ReflectionTestUtils.setField(refreshTokenService, "expirationDays", 7);
    }

    @Test
    @DisplayName("正常作成: RefreshToken が DB に保存される")
    void create_success() {
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken token = refreshTokenService.create(alice);

        assertThat(token.getToken()).isNotBlank();
        assertThat(token.getExpiresAt()).isAfter(LocalDateTime.now());
        assertThat(token.isRevoked()).isFalse();
        verify(refreshTokenRepository).save(any());
    }

    @Test
    @DisplayName("正常検証: 有効なトークンが返る")
    void validate_success() {
        RefreshToken token = RefreshToken.builder()
                .token("valid-uuid")
                .user(alice)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByToken("valid-uuid")).thenReturn(Optional.of(token));

        RefreshToken result = refreshTokenService.validate("valid-uuid");

        assertThat(result.getToken()).isEqualTo("valid-uuid");
    }

    @Test
    @DisplayName("失効済みトークン: UnauthorizedException が発生する")
    void validate_revoked() {
        RefreshToken token = RefreshToken.builder()
                .token("revoked-uuid")
                .user(alice)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(true)
                .build();

        when(refreshTokenRepository.findByToken("revoked-uuid")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> refreshTokenService.validate("revoked-uuid"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("無効化");
    }

    @Test
    @DisplayName("期限切れトークン: UnauthorizedException が発生する")
    void validate_expired() {
        RefreshToken token = RefreshToken.builder()
                .token("expired-uuid")
                .user(alice)
                .expiresAt(LocalDateTime.now().minusDays(1))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByToken("expired-uuid")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> refreshTokenService.validate("expired-uuid"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("有効期限");
    }

    @Test
    @DisplayName("ローテーション: 古いトークンが revoked になり新しいトークンが返る")
    void rotate_success() {
        RefreshToken old = RefreshToken.builder()
                .token("old-uuid").user(alice)
                .expiresAt(LocalDateTime.now().plusDays(7)).revoked(false).build();

        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken newToken = refreshTokenService.rotate(old);

        assertThat(old.isRevoked()).isTrue();
        assertThat(newToken.getToken()).isNotEqualTo("old-uuid");
        assertThat(newToken.isRevoked()).isFalse();
    }

    @Test
    @DisplayName("全削除: ユーザーの全リフレッシュトークンが削除される")
    void revokeAllByUser_success() {
        refreshTokenService.revokeAllByUser(alice);

        verify(refreshTokenRepository).deleteByUser(alice);
    }
}
