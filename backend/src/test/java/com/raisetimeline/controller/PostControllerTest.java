package com.raisetimeline.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.raisetimeline.dto.request.CreatePostRequest;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.security.JwtUtil;
import com.raisetimeline.security.UserDetailsServiceImpl;
import com.raisetimeline.service.PostService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
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
class PostControllerTest {

    @Autowired WebApplicationContext webApplicationContext;
    @Autowired JwtUtil jwtUtil;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean PostService postService;
    @MockitoBean UserDetailsServiceImpl userDetailsService;

    private MockMvc mockMvc;
    private String aliceToken;
    private String bobToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        aliceToken = jwtUtil.generateToken("alice@example.com");
        bobToken   = jwtUtil.generateToken("bob@example.com");

        UserDetails alice = User.withUsername("alice@example.com").password("pw").roles("USER").build();
        UserDetails bob   = User.withUsername("bob@example.com").password("pw").roles("USER").build();
        when(userDetailsService.loadUserByUsername("alice@example.com")).thenReturn(alice);
        when(userDetailsService.loadUserByUsername("bob@example.com")).thenReturn(bob);
    }

    // ─── GET /api/posts — デシジョンテーブル: 認証 ────────────────────────

    @Test
    @DisplayName("GET /api/posts: 認証あり → 200")
    void getTimeline_authenticated() throws Exception {
        when(postService.getTimeline(anyString(), anyInt(), anyInt())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/posts")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/posts: 認証なし → 401")
    void getTimeline_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/posts"))
                .andExpect(status().isUnauthorized());
    }

    // ─── GET /api/posts/following ─────────────────────────────────────────

    @Test
    @DisplayName("GET /api/posts/following: 認証あり → 200")
    void getFollowingTimeline_authenticated() throws Exception {
        when(postService.getFollowingTimeline(anyString(), anyInt(), anyInt())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/posts/following")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/posts/following: 認証なし → 401")
    void getFollowingTimeline_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/posts/following"))
                .andExpect(status().isUnauthorized());
    }

    // ─── GET /api/posts/{postId} ──────────────────────────────────────────

    @Test
    @DisplayName("GET /api/posts/1: 認証あり、存在する投稿 → 200")
    void getPost_authenticated() throws Exception {
        when(postService.getPost(anyString(), eq(1L))).thenReturn(null);

        mockMvc.perform(get("/api/posts/1")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/posts/99: 認証あり、存在しない投稿 → 404")
    void getPost_notFound() throws Exception {
        when(postService.getPost(anyString(), eq(99L)))
                .thenThrow(new ResourceNotFoundException("投稿が見つかりません"));

        mockMvc.perform(get("/api/posts/99")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNotFound());
    }

    // ─── POST /api/posts — デシジョンテーブル: 認証 ───────────────────────

    @Test
    @DisplayName("POST /api/posts: 認証あり → 201")
    void createPost_authenticated() throws Exception {
        when(postService.create(anyString(), any(), any())).thenReturn(null);

        mockMvc.perform(multipart("/api/posts")
                        .param("content", "Hello")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/posts: 認証なし → 401")
    void createPost_unauthenticated() throws Exception {
        mockMvc.perform(multipart("/api/posts"))
                .andExpect(status().isUnauthorized());
    }

    // ─── PUT /api/posts/{id} — デシジョンテーブル: 認証 × 所有権 ──────────

    @Test
    @DisplayName("PUT /api/posts/1: 認証あり・作者本人 → 200")
    void updatePost_owner() throws Exception {
        when(postService.update(eq("alice@example.com"), eq(1L), any())).thenReturn(null);

        CreatePostRequest req = new CreatePostRequest();
        req.setContent("updated");

        mockMvc.perform(put("/api/posts/1")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/posts/1: 認証あり・他人の投稿 → 403")
    void updatePost_forbidden() throws Exception {
        when(postService.update(eq("bob@example.com"), eq(1L), any()))
                .thenThrow(new ForbiddenException("編集権限がありません"));

        CreatePostRequest req = new CreatePostRequest();
        req.setContent("hack");

        mockMvc.perform(put("/api/posts/1")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /api/posts/1: 認証なし → 401")
    void updatePost_unauthenticated() throws Exception {
        CreatePostRequest req = new CreatePostRequest();
        req.setContent("text");

        mockMvc.perform(put("/api/posts/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // ─── DELETE /api/posts/{id} — デシジョンテーブル: 認証 × 所有権 ───────

    @Test
    @DisplayName("DELETE /api/posts/1: 認証あり・作者本人 → 204")
    void deletePost_owner() throws Exception {
        mockMvc.perform(delete("/api/posts/1")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/posts/1: 認証あり・他人の投稿 → 403")
    void deletePost_forbidden() throws Exception {
        doThrow(new ForbiddenException("削除権限がありません"))
                .when(postService).delete(eq("bob@example.com"), eq(1L));

        mockMvc.perform(delete("/api/posts/1")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /api/posts/1: 認証なし → 401")
    void deletePost_unauthenticated() throws Exception {
        mockMvc.perform(delete("/api/posts/1"))
                .andExpect(status().isUnauthorized());
    }
}
