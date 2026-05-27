package com.raisetimeline.service;

import com.raisetimeline.dto.request.LoginRequest;
import com.raisetimeline.dto.request.RegisterRequest;
import com.raisetimeline.dto.response.AuthResponse;
import com.raisetimeline.dto.response.UserResponse;
import com.raisetimeline.entity.RefreshToken;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.DuplicateException;
import com.raisetimeline.repository.UserRepository;
import com.raisetimeline.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final S3Service s3Service;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new DuplicateException("このメールアドレスは既に登録されています");
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new DuplicateException("このユーザー名は既に使われています");
        }
        User user = User.builder()
                .username(req.getUsername())
                .displayName(req.getDisplayName())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .build();
        userRepository.save(user);
        log.info("User registered: username={}", req.getUsername());
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed: user not found");
                    return new BadCredentialsException("メールアドレスまたはパスワードが正しくありません");
                });
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed: bad credentials");
            throw new BadCredentialsException("メールアドレスまたはパスワードが正しくありません");
        }
        log.info("Login success: username={}", user.getUsername());
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(String refreshTokenValue) {
        RefreshToken old = refreshTokenService.validate(refreshTokenValue);
        RefreshToken newToken = refreshTokenService.rotate(old);
        String accessToken = jwtUtil.generateToken(old.getUser().getEmail());
        User refreshUser = old.getUser();
        log.info("Token refreshed: username={}", refreshUser.getUsername());
        String refreshAvatarUrl = refreshUser.getAvatarKey() != null
                ? s3Service.generatePresignedUrl(refreshUser.getAvatarKey())
                : null;
        return new AuthResponse(accessToken, newToken.getToken(), new UserResponse(refreshUser, refreshAvatarUrl));
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        RefreshToken token = refreshTokenService.validate(refreshTokenValue);
        refreshTokenService.revokeAllByUser(token.getUser());
        log.info("Logout: username={}", token.getUser().getUsername());
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateToken(user.getEmail());
        RefreshToken refreshToken = refreshTokenService.create(user);
        String avatarUrl = user.getAvatarKey() != null
                ? s3Service.generatePresignedUrl(user.getAvatarKey())
                : null;
        return new AuthResponse(accessToken, refreshToken.getToken(), new UserResponse(user, avatarUrl));
    }
}
