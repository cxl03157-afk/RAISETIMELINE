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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserService userService;

    public List<CommentResponse> getComments(Long postId) {
        findPost(postId);
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(CommentResponse::new)
                .toList();
    }

    @Transactional
    public CommentResponse create(String email, Long postId, CreateCommentRequest req) {
        Post post = findPost(postId);
        User user = userService.getByEmail(email);
        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .content(req.getContent())
                .build();
        return new CommentResponse(commentRepository.save(comment));
    }

    @Transactional
    public void delete(String email, Long postId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("コメントが見つかりません: " + commentId));
        if (!comment.getPost().getId().equals(postId)) {
            throw new ResourceNotFoundException("コメントが見つかりません: " + commentId);
        }
        if (!comment.getUser().getEmail().equals(email)) {
            throw new ForbiddenException("このコメントを削除する権限がありません");
        }
        commentRepository.delete(comment);
    }

    private Post findPost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("投稿が見つかりません: " + postId));
    }
}
