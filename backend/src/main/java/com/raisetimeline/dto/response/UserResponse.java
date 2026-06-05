package com.raisetimeline.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.raisetimeline.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Schema(description = "ユーザー情報レスポンス")
public class UserResponse {
    @Schema(description = "ユーザーID", example = "1")
    private final Long id;

    @Schema(description = "ユーザー名（ユニーク）", example = "taro_suzuki")
    private final String username;

    @Schema(description = "表示名", example = "鈴木 太郎")
    private final String displayName;

    @Schema(description = "アバター画像の presigned URL")
    private final String avatarUrl;

    @Schema(description = "自己紹介文", example = "東京在住のエンジニアです")
    private final String bio;

    @Schema(description = "フォロー中のユーザー数", example = "120")
    private final long followingCount;

    @Schema(description = "フォロワー数", example = "340")
    private final long followersCount;

    @Schema(description = "自分がフォローしているか", example = "false")
    // Lombok generates isFollowedByMe() → Jackson serializes as "followedByMe"
    private final boolean followedByMe;

    @Schema(description = "アカウント作成日時")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", timezone = "UTC")
    private final LocalDateTime createdAt;

    // 認証レスポンス用（ログイン・登録・リフレッシュ時）— フォロー情報は 0/false
    // avatarUrl は Service 側で avatarKey から presigned URL を生成して渡す
    public UserResponse(User user, String avatarUrl) {
        this(user, 0L, 0L, false, avatarUrl);
    }

    // プロフィール取得・更新・検索・フォロー一覧用
    public UserResponse(User user, long followingCount, long followersCount, boolean followedByMe, String avatarUrl) {
        this.id             = user.getId();
        this.username       = user.getUsername();
        this.displayName    = user.getDisplayName();
        this.avatarUrl      = avatarUrl;
        this.bio            = user.getBio();
        this.followingCount = followingCount;
        this.followersCount = followersCount;
        this.followedByMe   = followedByMe;
        this.createdAt      = user.getCreatedAt();
    }
}
