package com.raisetimeline.controller;

import com.raisetimeline.dto.request.CreatePostRequest;
import com.raisetimeline.dto.response.PostResponse;
import com.raisetimeline.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Tag(name = "post", description = "投稿 (作成/取得/更新/削除/タイムライン)")
public class PostController {

    private final PostService postService;

    @Operation(summary = "全体タイムライン取得")
    @ApiResponse(responseCode = "200", description = "取得成功")
    @GetMapping
    public Page<PostResponse> getTimeline(
            @AuthenticationPrincipal UserDetails principal,
            @Parameter(description = "ページ番号 (0始まり)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "1ページあたりの件数") @RequestParam(defaultValue = "20") int size) {
        return postService.getTimeline(principal.getUsername(), page, size);
    }

    @Operation(summary = "フォロー中ユーザーのタイムライン取得")
    @ApiResponse(responseCode = "200", description = "取得成功")
    @GetMapping("/following")
    public Page<PostResponse> getFollowingTimeline(
            @AuthenticationPrincipal UserDetails principal,
            @Parameter(description = "ページ番号 (0始まり)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "1ページあたりの件数") @RequestParam(defaultValue = "20") int size) {
        return postService.getFollowingTimeline(principal.getUsername(), page, size);
    }

    @Operation(summary = "投稿詳細取得")
    @ApiResponse(responseCode = "200", description = "取得成功")
    @ApiResponse(responseCode = "404", description = "投稿が見つからない")
    @GetMapping("/{postId}")
    public PostResponse getPost(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId) {
        return postService.getPost(principal.getUsername(), postId);
    }

    @Operation(summary = "投稿作成 (画像最大4枚)",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE)))
    @ApiResponse(responseCode = "201", description = "投稿作成成功")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(
            @AuthenticationPrincipal UserDetails principal,
            @Parameter(description = "投稿本文") @RequestParam(required = false) String content,
            @Parameter(description = "添付画像 (最大4枚)") @RequestParam(required = false) List<MultipartFile> images) {
        return postService.create(principal.getUsername(), content, images);
    }

    @Operation(summary = "投稿更新")
    @ApiResponse(responseCode = "200", description = "更新成功")
    @ApiResponse(responseCode = "403", description = "他ユーザーの投稿は編集不可")
    @ApiResponse(responseCode = "404", description = "投稿が見つからない")
    @PutMapping("/{postId}")
    public PostResponse update(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId,
            @Valid @RequestBody CreatePostRequest req) {
        return postService.update(principal.getUsername(), postId, req);
    }

    @Operation(summary = "投稿削除")
    @ApiResponse(responseCode = "204", description = "削除成功")
    @ApiResponse(responseCode = "403", description = "他ユーザーの投稿は削除不可")
    @ApiResponse(responseCode = "404", description = "投稿が見つからない")
    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId) {
        postService.delete(principal.getUsername(), postId);
    }
}
