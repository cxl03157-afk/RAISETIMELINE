package com.raisetimeline.service;

import com.raisetimeline.dto.request.CreateCommentRequest;
import com.raisetimeline.dto.response.CommentResponse;
import com.raisetimeline.entity.Comment;
import com.raisetimeline.entity.Post;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.ResourceNotFoundException;
import com.raisetimeline.repository.CommentRepository;
import com.raisetimeline.repository.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock CommentRepository commentRepository;
    @Mock PostRepository postRepository;
    @Mock UserService userService;

    @InjectMocks CommentService commentService;

    private User alice;
    private User bob;
    private Post post;

    @BeforeEach
    void setUp() {
        alice = User.builder().id(1L).email("alice@example.com").username("alice").displayName("Alice").build();
        bob   = User.builder().id(2L).email("bob@example.com").username("bob").displayName("Bob").build();
        post  = Post.builder().id(1L).user(alice).content("Hello").build();
    }

    @Test
    @DisplayName("正常作成: コメントが保存されレスポンスが返る")
    void create_success() {
        CreateCommentRequest req = new CreateCommentRequest();
        req.setContent("Nice post!");

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(userService.getByEmail("alice@example.com")).thenReturn(alice);
        when(commentRepository.save(any())).thenAnswer(inv -> {
            Comment c = inv.getArgument(0);
            c.setId(1L);
            return c;
        });

        CommentResponse res = commentService.create("alice@example.com", 1L, req);

        assertThat(res.getContent()).isEqualTo("Nice post!");
        assertThat(res.getUser().getUsername()).isEqualTo("alice");
        verify(commentRepository).save(any());
    }

    @Test
    @DisplayName("コメント削除: 作者本人なら削除される")
    void delete_success() {
        Comment comment = Comment.builder().id(10L).post(post).user(alice).content("hi").build();

        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));

        commentService.delete("alice@example.com", 1L, 10L);

        verify(commentRepository).delete(comment);
    }

    @Test
    @DisplayName("コメント削除: 他人のコメントは ForbiddenException")
    void delete_forbidden() {
        Comment comment = Comment.builder().id(10L).post(post).user(alice).content("hi").build();

        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.delete("bob@example.com", 1L, 10L))
                .isInstanceOf(ForbiddenException.class);
        verify(commentRepository, never()).delete(any());
    }

    @Test
    @DisplayName("存在しない投稿へのコメント: ResourceNotFoundException")
    void create_postNotFound() {
        CreateCommentRequest req = new CreateCommentRequest();
        req.setContent("hi");

        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.create("alice@example.com", 99L, req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("別投稿のコメントIDを指定した削除: ResourceNotFoundException")
    void delete_wrongPost() {
        Post otherPost = Post.builder().id(2L).user(bob).content("Other").build();
        Comment comment = Comment.builder().id(10L).post(otherPost).user(alice).content("hi").build();

        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.delete("alice@example.com", 1L, 10L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
