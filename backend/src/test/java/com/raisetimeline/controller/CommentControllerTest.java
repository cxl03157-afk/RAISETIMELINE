package com.raisetimeline.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.raisetimeline.dto.request.CreateCommentRequest;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.security.JwtUtil;
import com.raisetimeline.security.UserDetailsServiceImpl;
import com.raisetimeline.service.CommentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
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
class CommentControllerTest {

    @Autowired WebApplicationContext webApplicationContext;
    @Autowired JwtUtil jwtUtil;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean CommentService commentService;
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

    // ─── GET /api/posts/{postId}/comments ────────────────────────────────

    @Test
    @DisplayName("GET /api/posts/1/comments: 認証あり → 200")
    void getComments_authenticated() throws Exception {
        when(commentService.getComments(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/posts/1/comments")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/posts/1/comments: 認証なし → 401")
    void getComments_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/posts/1/comments"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/posts/99/comments: 存在しない投稿 → 404")
    void getComments_postNotFound() throws Exception {
        when(commentService.getComments(99L))
                .thenThrow(new ResourceNotFoundException("投稿が見つかりません"));

        mockMvc.perform(get("/api/posts/99/comments")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNotFound());
    }

    // ─── POST /api/posts/{postId}/comments ───────────────────────────────

    @Test
    @DisplayName("POST /api/posts/1/comments: 認証あり → 201")
    void createComment_authenticated() throws Exception {
        when(commentService.create(anyString(), eq(1L), any())).thenReturn(null);

        CreateCommentRequest req = new CreateCommentRequest();
        req.setContent("Nice post!");

        mockMvc.perform(post("/api/posts/1/comments")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/posts/1/comments: 認証なし → 401")
    void createComment_unauthenticated() throws Exception {
        CreateCommentRequest req = new CreateCommentRequest();
        req.setContent("Nice post!");

        mockMvc.perform(post("/api/posts/1/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/posts/1/comments: 空コメント → 400")
    void createComment_blankContent() throws Exception {
        CreateCommentRequest req = new CreateCommentRequest();
        req.setContent(""); // 空

        mockMvc.perform(post("/api/posts/1/comments")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ─── DELETE /api/posts/{postId}/comments/{commentId} ─────────────────

    @Test
    @DisplayName("DELETE /api/posts/1/comments/1: 認証あり・作者本人 → 204")
    void deleteComment_owner() throws Exception {
        mockMvc.perform(delete("/api/posts/1/comments/1")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/posts/1/comments/1: 認証あり・他人のコメント → 403")
    void deleteComment_forbidden() throws Exception {
        doThrow(new ForbiddenException("削除権限がありません"))
                .when(commentService).delete(eq("bob@example.com"), eq(1L), eq(1L));

        mockMvc.perform(delete("/api/posts/1/comments/1")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /api/posts/1/comments/1: 認証なし → 401")
    void deleteComment_unauthenticated() throws Exception {
        mockMvc.perform(delete("/api/posts/1/comments/1"))
                .andExpect(status().isUnauthorized());
    }
}
