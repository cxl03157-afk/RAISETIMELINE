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
    private final long followingCount;
    private final long followersCount;
    // Lombok generates isFollowedByMe() → Jackson serializes as "followedByMe"
    private final boolean followedByMe;
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
