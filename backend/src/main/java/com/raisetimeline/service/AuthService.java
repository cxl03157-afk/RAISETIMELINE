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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

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
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadCredentialsException("メールアドレスまたはパスワードが正しくありません"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("メールアドレスまたはパスワードが正しくありません");
        }
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(String refreshTokenValue) {
        RefreshToken old = refreshTokenService.validate(refreshTokenValue);
        RefreshToken newToken = refreshTokenService.rotate(old);
        String accessToken = jwtUtil.generateToken(old.getUser().getEmail());
        return new AuthResponse(accessToken, newToken.getToken(), new UserResponse(old.getUser()));
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        RefreshToken token = refreshTokenService.validate(refreshTokenValue);
        refreshTokenService.revokeAllByUser(token.getUser());
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateToken(user.getEmail());
        RefreshToken refreshToken = refreshTokenService.create(user);
        return new AuthResponse(accessToken, refreshToken.getToken(), new UserResponse(user));
    }
}
