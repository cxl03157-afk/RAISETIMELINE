package com.raisetimeline.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.raisetimeline.dto.request.UpdateProfileRequest;
import com.raisetimeline.exception.DuplicateException;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.security.JwtUtil;
import com.raisetimeline.security.UserDetailsServiceImpl;
import com.raisetimeline.service.FollowService;
import com.raisetimeline.service.PostService;
import com.raisetimeline.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
class UserControllerTest {

    @Autowired WebApplicationContext webApplicationContext;
    @Autowired JwtUtil jwtUtil;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean UserService userService;
    @MockitoBean PostService postService;
    @MockitoBean FollowService followService;
    @MockitoBean UserDetailsServiceImpl userDetailsService;

    private MockMvc mockMvc;
    private String aliceToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        aliceToken = jwtUtil.generateToken("alice@example.com");

        UserDetails alice = User.withUsername("alice@example.com").password("pw").roles("USER").build();
        when(userDetailsService.loadUserByUsername("alice@example.com")).thenReturn(alice);
    }

    // ─── GET /api/users/{username} ────────────────────────────────────────

    @Test
    @DisplayName("GET /api/users/alice: 認証あり、ユーザー存在 → 200")
    void getProfile_success() throws Exception {
        when(userService.getProfile(eq("alice"), anyString())).thenReturn(null);

        mockMvc.perform(get("/api/users/alice")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/users/ghost: 存在しないユーザー → 404")
    void getProfile_notFound() throws Exception {
        when(userService.getProfile(eq("ghost"), anyString()))
                .thenThrow(new ResourceNotFoundException("ユーザーが見つかりません"));

        mockMvc.perform(get("/api/users/ghost")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/users/alice: 認証なし → 401")
    void getProfile_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/users/alice"))
                .andExpect(status().isUnauthorized());
    }

    // ─── PUT /api/users/me ────────────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/users/me: 認証あり → 200")
    void updateProfile_success() throws Exception {
        when(userService.updateProfile(anyString(), any())).thenReturn(null);

        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setDisplayName("New Name");

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/users/me: 認証なし → 401")
    void updateProfile_unauthenticated() throws Exception {
        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setDisplayName("New Name");

        mockMvc.perform(put("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // ─── PUT /api/users/me/avatar ─────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/users/me/avatar: 認証あり、JPEG → 200")
    void uploadAvatar_success() throws Exception {
        when(userService.uploadAvatar(anyString(), any())).thenReturn(null);

        MockMultipartFile avatar = new MockMultipartFile(
                "avatar", "photo.jpg", "image/jpeg", new byte[100]);

        mockMvc.perform(multipart("/api/users/me/avatar")
                        .file(avatar)
                        .with(req -> { req.setMethod("PUT"); return req; })
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());
    }

    // ─── GET /api/users/search ────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/users/search: 認証あり → 200")
    void searchUsers_success() throws Exception {
        when(userService.searchUsers(anyString(), anyString())).thenReturn(List.of());

        mockMvc.perform(get("/api/users/search")
                        .param("q", "bob")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/users/search: 認証なし → 401")
    void searchUsers_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/users/search").param("q", "bob"))
                .andExpect(status().isUnauthorized());
    }

    // ─── POST /api/users/{username}/follow ────────────────────────────────

    @Test
    @DisplayName("POST /api/users/bob/follow: 認証あり → 201")
    void follow_success() throws Exception {
        mockMvc.perform(post("/api/users/bob/follow")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/users/alice/follow: 自分自身をフォロー → 400")
    void follow_selfFollow() throws Exception {
        doThrow(new com.raisetimeline.exception.BadRequestException("自分自身はフォローできません"))
                .when(followService).follow(anyString(), eq("alice"));

        mockMvc.perform(post("/api/users/alice/follow")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/users/bob/follow: すでにフォロー済み → 409")
    void follow_duplicate() throws Exception {
        doThrow(new DuplicateException("すでにフォローしています"))
                .when(followService).follow(anyString(), eq("bob"));

        mockMvc.perform(post("/api/users/bob/follow")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isConflict());
    }

    // ─── DELETE /api/users/{username}/follow ──────────────────────────────

    @Test
    @DisplayName("DELETE /api/users/bob/follow: 認証あり → 204")
    void unfollow_success() throws Exception {
        mockMvc.perform(delete("/api/users/bob/follow")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/users/bob/follow: 認証なし → 401")
    void unfollow_unauthenticated() throws Exception {
        mockMvc.perform(delete("/api/users/bob/follow"))
                .andExpect(status().isUnauthorized());
    }
}
