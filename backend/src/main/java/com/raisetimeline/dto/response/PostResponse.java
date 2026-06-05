package com.raisetimeline.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.raisetimeline.entity.Post;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Schema(description = "投稿レスポンス")
public class PostResponse {

    @Schema(description = "投稿ID", example = "42")
    private final Long id;

    @Schema(description = "投稿本文 (最大280文字)", example = "今日もコーディング頑張ります！")
    private final String content;

    @Schema(description = "投稿者のユーザー情報")
    private final UserResponse user;

    @Schema(description = "添付画像の presigned URL リスト (最大4件)")
    private final List<String> imageUrls;

    @Schema(description = "いいね数", example = "15")
    private final int likeCount;

    @Schema(description = "コメント数", example = "3")
    private final int commentCount;

    @Schema(description = "自分がいいねしているか", example = "false")
    private final boolean likedByCurrentUser;

    @Schema(description = "投稿日時")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", timezone = "UTC")
    private final LocalDateTime createdAt;

    @Schema(description = "更新日時")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", timezone = "UTC")
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
