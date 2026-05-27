package com.raisetimeline.controller;

import com.raisetimeline.exception.DuplicateException;
import com.raisetimeline.security.JwtUtil;
import com.raisetimeline.security.UserDetailsServiceImpl;
import com.raisetimeline.service.LikeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
class LikeControllerTest {

    @Autowired WebApplicationContext webApplicationContext;
    @Autowired JwtUtil jwtUtil;

    @MockitoBean LikeService likeService;
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

    // ─── POST /api/posts/{postId}/likes — 状態遷移: 未いいね → いいね ────

    @Test
    @DisplayName("POST /api/posts/1/likes: 認証あり → 201")
    void like_success() throws Exception {
        mockMvc.perform(post("/api/posts/1/likes")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/posts/1/likes: 二重いいね → 409")
    void like_duplicate() throws Exception {
        doThrow(new DuplicateException("すでにいいねしています"))
                .when(likeService).like(anyString(), eq(1L));

        mockMvc.perform(post("/api/posts/1/likes")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/posts/1/likes: 認証なし → 401")
    void like_unauthenticated() throws Exception {
        mockMvc.perform(post("/api/posts/1/likes"))
                .andExpect(status().isUnauthorized());
    }

    // ─── DELETE /api/posts/{postId}/likes — 状態遷移: いいね → 未いいね ──

    @Test
    @DisplayName("DELETE /api/posts/1/likes: 認証あり → 204")
    void unlike_success() throws Exception {
        mockMvc.perform(delete("/api/posts/1/likes")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/posts/1/likes: 認証なし → 401")
    void unlike_unauthenticated() throws Exception {
        mockMvc.perform(delete("/api/posts/1/likes"))
                .andExpect(status().isUnauthorized());
    }
}
