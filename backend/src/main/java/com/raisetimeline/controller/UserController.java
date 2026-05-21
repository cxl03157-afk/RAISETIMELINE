package com.raisetimeline.controller;

import com.raisetimeline.dto.request.UpdateProfileRequest;
import com.raisetimeline.dto.response.PostResponse;
import com.raisetimeline.dto.response.UserResponse;
import com.raisetimeline.service.FollowService;
import com.raisetimeline.service.PostService;
import com.raisetimeline.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final PostService postService;
    private final FollowService followService;

    @GetMapping("/{username}")
    public UserResponse getProfile(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username) {
        return userService.getProfile(username, principal.getUsername());
    }

    @PutMapping("/me")
    public UserResponse updateProfile(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpdateProfileRequest req) {
        return userService.updateProfile(principal.getUsername(), req);
    }

    @GetMapping("/search")
    public List<UserResponse> searchUsers(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam String q) {
        return userService.searchUsers(q, principal.getUsername());
    }

    @GetMapping("/{username}/following")
    public Page<UserResponse> getFollowing(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return userService.getFollowing(username, principal.getUsername(), page, size);
    }

    @GetMapping("/{username}/followers")
    public Page<UserResponse> getFollowers(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return userService.getFollowers(username, principal.getUsername(), page, size);
    }

    @PostMapping("/{username}/follow")
    @ResponseStatus(HttpStatus.CREATED)
    public void follow(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username) {
        followService.follow(principal.getUsername(), username);
    }

    @DeleteMapping("/{username}/follow")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollow(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username) {
        followService.unfollow(principal.getUsername(), username);
    }

    @GetMapping("/{username}/posts")
    public List<PostResponse> getUserPosts(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username) {
        return postService.getUserPosts(username, principal.getUsername());
    }
}
