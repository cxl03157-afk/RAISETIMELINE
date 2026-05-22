package com.raisetimeline.controller;

import com.raisetimeline.dto.request.CreatePostRequest;
import com.raisetimeline.dto.response.PostResponse;
import com.raisetimeline.service.PostService;
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

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public Page<PostResponse> getTimeline(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return postService.getTimeline(principal.getUsername(), page, size);
    }

    @GetMapping("/following")
    public Page<PostResponse> getFollowingTimeline(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return postService.getFollowingTimeline(principal.getUsername(), page, size);
    }

    @GetMapping("/{postId}")
    public PostResponse getPost(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId) {
        return postService.getPost(principal.getUsername(), postId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) List<MultipartFile> images) {
        return postService.create(principal.getUsername(), content, images);
    }

    @PutMapping("/{postId}")
    public PostResponse update(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId,
            @Valid @RequestBody CreatePostRequest req) {
        return postService.update(principal.getUsername(), postId, req);
    }

    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long postId) {
        postService.delete(principal.getUsername(), postId);
    }
}
