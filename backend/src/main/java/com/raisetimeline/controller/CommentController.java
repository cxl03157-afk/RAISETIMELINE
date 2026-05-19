package com.raisetimeline.controller;

import com.raisetimeline.dto.request.CreateCommentRequest;
import com.raisetimeline.dto.response.CommentResponse;
import com.raisetimeline.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public List<CommentResponse> getComments(@PathVariable Long postId) {
        return commentService.getComments(postId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse create(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId,
            @Valid @RequestBody CreateCommentRequest req) {
        return commentService.create(principal.getUsername(), postId, req);
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId,
            @PathVariable Long commentId) {
        commentService.delete(principal.getUsername(), postId, commentId);
    }
}
