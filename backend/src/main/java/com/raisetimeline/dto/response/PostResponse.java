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
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public PostResponse(Post post) {
        this.id = post.getId();
        this.content = post.getContent();
        this.user = new UserResponse(post.getUser());
        this.imageUrls = post.getImages() == null ? List.of()
                : post.getImages().stream().map(img -> img.getImageUrl()).toList();
        this.likeCount = post.getLikes() == null ? 0 : post.getLikes().size();
        this.commentCount = post.getComments() == null ? 0 : post.getComments().size();
        this.createdAt = post.getCreatedAt();
        this.updatedAt = post.getUpdatedAt();
    }
}
