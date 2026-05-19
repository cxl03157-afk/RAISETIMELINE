package com.raisetimeline.controller;

import com.raisetimeline.dto.request.UpdateProfileRequest;
import com.raisetimeline.dto.response.PostResponse;
import com.raisetimeline.dto.response.UserResponse;
import com.raisetimeline.service.PostService;
import com.raisetimeline.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    @GetMapping("/{username}")
    public UserResponse getProfile(@PathVariable String username) {
        return userService.getProfile(username);
    }

    @PutMapping("/me")
    public UserResponse updateProfile(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpdateProfileRequest req) {
        return userService.updateProfile(principal.getUsername(), req);
    }

    @GetMapping("/{username}/posts")
    public List<PostResponse> getUserPosts(@PathVariable String username) {
        return postService.getUserPosts(username);
    }
}
