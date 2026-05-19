package com.raisetimeline.controller;

import com.raisetimeline.dto.request.UpdateProfileRequest;
import com.raisetimeline.dto.response.UserResponse;
import com.raisetimeline.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

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
}
