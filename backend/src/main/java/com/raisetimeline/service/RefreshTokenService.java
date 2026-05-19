package com.raisetimeline.service;

import com.raisetimeline.entity.RefreshToken;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.UnauthorizedException;
import com.raisetimeline.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.refresh-token.expiration-days}")
    private int expirationDays;

    @Transactional
    public RefreshToken create(User user) {
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusDays(expirationDays))
                .build();
        return refreshTokenRepository.save(token);
    }

    public RefreshToken validate(String tokenValue) {
        RefreshToken token = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new UnauthorizedException("リフレッシュトークンが無効です"));
        if (token.isRevoked()) {
            throw new UnauthorizedException("リフレッシュトークンは既に無効化されています");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("リフレッシュトークンの有効期限が切れています");
        }
        return token;
    }

    @Transactional
    public RefreshToken rotate(RefreshToken old) {
        old.setRevoked(true);
        refreshTokenRepository.save(old);
        return create(old.getUser());
    }

    @Transactional
    public void revokeAllByUser(User user) {
        refreshTokenRepository.deleteByUser(user);
    }
}
