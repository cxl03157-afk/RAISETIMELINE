package com.raisetimeline.dto.response;

import com.raisetimeline.entity.Post;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class PostResponse {

    private final Long id;
    private final String content;
    private final UserResponse user;
    private final List<String> imageUrls;
    private final int likeCount;
    private final int commentCount;
    private final boolean likedByCurrentUser;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public PostResponse(Post post, boolean likedByCurrentUser, List<String> imageUrls, String userAvatarUrl) {
        this.id = post.getId();
        this.content = post.getContent();
        this.user = new UserResponse(post.getUser(), userAvatarUrl);
        this.imageUrls = imageUrls != null ? imageUrls : List.of();
        this.likeCount = post.getLikeCount();
        this.commentCount = post.getCommentCount();
        this.likedByCurrentUser = likedByCurrentUser;
        this.createdAt = post.getCreatedAt();
        this.updatedAt = post.getUpdatedAt();
    }
}
