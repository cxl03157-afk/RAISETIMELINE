package com.raisetimeline.controller;

import com.raisetimeline.dto.request.LoginRequest;
import com.raisetimeline.dto.request.RefreshTokenRequest;
import com.raisetimeline.dto.request.RegisterRequest;
import com.raisetimeline.dto.response.AuthResponse;
import com.raisetimeline.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "auth", description = "認証 (登録/ログイン/リフレッシュ/ログアウト)")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "ユーザー登録", security = {})
    @ApiResponse(responseCode = "201", description = "登録成功")
    @ApiResponse(responseCode = "409", description = "ユーザー名またはメールアドレスが重複")
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @Operation(summary = "ログイン", security = {})
    @ApiResponse(responseCode = "200", description = "ログイン成功")
    @ApiResponse(responseCode = "401", description = "認証情報が不正")
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @Operation(summary = "アクセストークン更新", security = {})
    @ApiResponse(responseCode = "200", description = "トークン更新成功")
    @ApiResponse(responseCode = "401", description = "リフレッシュトークンが無効")
    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest req) {
        return authService.refresh(req.getRefreshToken());
    }

    @Operation(summary = "ログアウト", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "204", description = "ログアウト成功")
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshTokenRequest req) {
        authService.logout(req.getRefreshToken());
    }
}
