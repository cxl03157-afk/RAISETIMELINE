package com.raisetimeline.controller;

import com.raisetimeline.dto.request.CreateCommentRequest;
import com.raisetimeline.dto.response.CommentResponse;
import com.raisetimeline.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "comment", description = "コメント (作成/取得/削除)")
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "コメント一覧取得")
    @ApiResponse(responseCode = "200", description = "取得成功")
    @ApiResponse(responseCode = "404", description = "投稿が見つからない")
    @GetMapping
    public List<CommentResponse> getComments(@PathVariable Long postId) {
        return commentService.getComments(postId);
    }

    @Operation(summary = "コメント投稿")
    @ApiResponse(responseCode = "201", description = "コメント作成成功")
    @ApiResponse(responseCode = "404", description = "投稿が見つからない")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse create(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId,
            @Valid @RequestBody CreateCommentRequest req) {
        return commentService.create(principal.getUsername(), postId, req);
    }

    @Operation(summary = "コメント削除")
    @ApiResponse(responseCode = "204", description = "削除成功")
    @ApiResponse(responseCode = "403", description = "他ユーザーのコメントは削除不可")
    @ApiResponse(responseCode = "404", description = "コメントが見つからない")
    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId,
            @PathVariable Long commentId) {
        commentService.delete(principal.getUsername(), postId, commentId);
    }
}
