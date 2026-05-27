package com.raisetimeline.controller;

import com.raisetimeline.service.LikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/{postId}/likes")
@RequiredArgsConstructor
@Tag(name = "like", description = "いいね (追加/取り消し)")
public class LikeController {

    private final LikeService likeService;

    @Operation(summary = "いいね")
    @ApiResponse(responseCode = "201", description = "いいね成功")
    @ApiResponse(responseCode = "409", description = "すでにいいね済み")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void like(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId) {
        likeService.like(principal.getUsername(), postId);
    }

    @Operation(summary = "いいね取り消し")
    @ApiResponse(responseCode = "204", description = "取り消し成功")
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlike(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId) {
        likeService.unlike(principal.getUsername(), postId);
    }
}
