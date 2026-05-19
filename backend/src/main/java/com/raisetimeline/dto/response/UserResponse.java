package com.raisetimeline.dto.response;

import com.raisetimeline.entity.User;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class UserResponse {
    private final Long id;
    private final String username;
    private final String displayName;
    private final String avatarUrl;
    private final String bio;
    private final LocalDateTime createdAt;

    public UserResponse(User user) {
        this.id          = user.getId();
        this.username    = user.getUsername();
        this.displayName = user.getDisplayName();
        this.avatarUrl   = user.getAvatarUrl();
        this.bio         = user.getBio();
        this.createdAt   = user.getCreatedAt();
    }
}
