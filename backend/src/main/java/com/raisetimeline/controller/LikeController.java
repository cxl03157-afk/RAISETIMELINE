package com.raisetimeline.controller;

import com.raisetimeline.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/{postId}/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void like(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId) {
        likeService.like(principal.getUsername(), postId);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlike(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId) {
        likeService.unlike(principal.getUsername(), postId);
    }
}
