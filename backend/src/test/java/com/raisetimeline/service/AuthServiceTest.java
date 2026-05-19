package com.raisetimeline.service;

import com.raisetimeline.dto.request.LoginRequest;
import com.raisetimeline.dto.request.RegisterRequest;
import com.raisetimeline.dto.response.AuthResponse;
import com.raisetimeline.entity.RefreshToken;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.DuplicateException;
import com.raisetimeline.repository.UserRepository;
import com.raisetimeline.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtUtil jwtUtil;
    @Mock RefreshTokenService refreshTokenService;

    @InjectMocks AuthService authService;

    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setUsername("alice");
        registerRequest.setDisplayName("Alice");
        registerRequest.setEmail("alice@example.com");
        registerRequest.setPassword("password123");
    }

    @Test
    @DisplayName("正常登録: JWT とリフレッシュトークンとユーザー情報が返る")
    void register_success() {
        RefreshToken mockRefreshToken = RefreshToken.builder()
                .token("refresh-uuid").expiresAt(LocalDateTime.now().plusDays(7)).build();

        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtUtil.generateToken(any())).thenReturn("mock-token");
        when(refreshTokenService.create(any())).thenReturn(mockRefreshToken);

        AuthResponse res = authService.register(registerRequest);

        assertThat(res.getToken()).isEqualTo("mock-token");
        assertThat(res.getRefreshToken()).isEqualTo("refresh-uuid");
        assertThat(res.getUser().getUsername()).isEqualTo("alice");
        verify(userRepository).save(any());
    }

    @Test
    @DisplayName("メール重複: DuplicateException が発生する")
    void register_duplicateEmail() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(DuplicateException.class)
                .hasMessageContaining("メールアドレス");
    }

    @Test
    @DisplayName("ユーザー名重複: DuplicateException が発生する")
    void register_duplicateUsername() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(DuplicateException.class)
                .hasMessageContaining("ユーザー名");
    }

    @Test
    @DisplayName("正常ログイン: JWT とリフレッシュトークンが返る")
    void login_success() {
        User user = User.builder()
                .id(1L).email("alice@example.com").passwordHash("hashed")
                .username("alice").displayName("Alice").build();
        LoginRequest req = new LoginRequest();
        req.setEmail("alice@example.com");
        req.setPassword("password123");
        RefreshToken mockRefreshToken = RefreshToken.builder()
                .token("refresh-uuid").expiresAt(LocalDateTime.now().plusDays(7)).build();

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(jwtUtil.generateToken(any())).thenReturn("mock-token");
        when(refreshTokenService.create(any())).thenReturn(mockRefreshToken);

        AuthResponse res = authService.login(req);

        assertThat(res.getToken()).isEqualTo("mock-token");
        assertThat(res.getRefreshToken()).isEqualTo("refresh-uuid");
    }

    @Test
    @DisplayName("パスワード不一致: BadCredentialsException が発生する")
    void login_wrongPassword() {
        User user = User.builder()
                .id(1L).email("alice@example.com").passwordHash("hashed")
                .username("alice").displayName("Alice").build();
        LoginRequest req = new LoginRequest();
        req.setEmail("alice@example.com");
        req.setPassword("wrong");

        when(userRepository.findByEmail(any())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("存在しないメール: BadCredentialsException が発生する")
    void login_userNotFound() {
        LoginRequest req = new LoginRequest();
        req.setEmail("nobody@example.com");
        req.setPassword("pass");

        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);
    }
}
