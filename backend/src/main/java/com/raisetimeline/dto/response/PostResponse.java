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

    // 変異操作用（create: 未いいね確定）
    public PostResponse(Post post) {
        this(post, false);
    }

    // 読み取り用（timeline / getPost / update）
    public PostResponse(Post post, boolean likedByCurrentUser) {
        this.id = post.getId();
        this.content = post.getContent();
        this.user = new UserResponse(post.getUser());
        this.imageUrls = post.getImages() == null ? List.of()
                : post.getImages().stream().map(img -> img.getImageUrl()).toList();
        this.likeCount = post.getLikeCount();
        this.commentCount = post.getCommentCount();
        this.likedByCurrentUser = likedByCurrentUser;
        this.createdAt = post.getCreatedAt();
        this.updatedAt = post.getUpdatedAt();
    }
}
