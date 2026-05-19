package com.raisetimeline.dto.response;

import com.raisetimeline.entity.Comment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class CommentResponse {

    private final Long id;
    private final String content;
    private final UserResponse user;
    private final LocalDateTime createdAt;

    public CommentResponse(Comment comment) {
        this.id = comment.getId();
        this.content = comment.getContent();
        this.user = new UserResponse(comment.getUser());
        this.createdAt = comment.getCreatedAt();
    }
}
