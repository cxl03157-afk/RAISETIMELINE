package com.raisetimeline.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.raisetimeline.entity.Comment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class CommentResponse {

    private final Long id;
    private final String content;
    private final UserResponse user;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", timezone = "UTC")
    private final LocalDateTime createdAt;

    public CommentResponse(Comment comment, String userAvatarUrl) {
        this.id = comment.getId();
        this.content = comment.getContent();
        this.user = new UserResponse(comment.getUser(), userAvatarUrl);
        this.createdAt = comment.getCreatedAt();
    }
}
