package com.raisetimeline.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.raisetimeline.dto.request.LoginRequest;
import com.raisetimeline.dto.request.RefreshTokenRequest;
import com.raisetimeline.dto.request.RegisterRequest;
import com.raisetimeline.dto.response.AuthResponse;
import com.raisetimeline.exception.DuplicateException;
import com.raisetimeline.exception.UnauthorizedException;
import com.raisetimeline.security.UserDetailsServiceImpl;
import com.raisetimeline.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired WebApplicationContext webApplicationContext;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean AuthService authService;
    @MockitoBean UserDetailsServiceImpl userDetailsService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    private AuthResponse dummyAuthResponse() {
        return new AuthResponse("access-token", "refresh-token", null);
    }

    // ─── register ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/register: 正常 → 201")
    void register_success() throws Exception {
        when(authService.register(any())).thenReturn(dummyAuthResponse());

        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice01");
        req.setDisplayName("Alice");
        req.setEmail("alice@example.com");
        req.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/auth/register: ユーザー名重複 → 409")
    void register_duplicateUsername() throws Exception {
        when(authService.register(any())).thenThrow(new DuplicateException("このユーザー名は使用できません"));

        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice01");
        req.setDisplayName("Alice");
        req.setEmail("alice@example.com");
        req.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/auth/register: メールアドレス重複 → 409")
    void register_duplicateEmail() throws Exception {
        when(authService.register(any())).thenThrow(new DuplicateException("このメールアドレスは使用できません"));

        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice01");
        req.setDisplayName("Alice");
        req.setEmail("alice@example.com");
        req.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/auth/register: バリデーションエラー（短いパスワード）→ 400")
    void register_validationError() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice01");
        req.setDisplayName("Alice");
        req.setEmail("alice@example.com");
        req.setPassword("short"); // 8文字未満

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ─── login ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login: 正常 → 200")
    void login_success() throws Exception {
        when(authService.login(any())).thenReturn(dummyAuthResponse());

        LoginRequest req = new LoginRequest();
        req.setEmail("alice@example.com");
        req.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/auth/login: パスワード不一致 → 401")
    void login_wrongPassword() throws Exception {
        when(authService.login(any())).thenThrow(new UnauthorizedException("メールアドレスまたはパスワードが違います"));

        LoginRequest req = new LoginRequest();
        req.setEmail("alice@example.com");
        req.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // ─── refresh ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/refresh: 正常 → 200")
    void refresh_success() throws Exception {
        when(authService.refresh(any())).thenReturn(dummyAuthResponse());

        RefreshTokenRequest req = new RefreshTokenRequest();
        req.setRefreshToken("valid-refresh-token");

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/auth/refresh: 無効トークン → 401")
    void refresh_invalidToken() throws Exception {
        when(authService.refresh(any())).thenThrow(new UnauthorizedException("無効なリフレッシュトークンです"));

        RefreshTokenRequest req = new RefreshTokenRequest();
        req.setRefreshToken("invalid-token");

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // ─── logout ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/logout: 正常 → 204")
    void logout_success() throws Exception {
        RefreshTokenRequest req = new RefreshTokenRequest();
        req.setRefreshToken("valid-refresh-token");

        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNoContent());
    }
}
