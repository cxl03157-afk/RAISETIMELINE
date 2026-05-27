package com.raisetimeline.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "プロフィール更新リクエスト")
public class UpdateProfileRequest {

    @Schema(description = "表示名 (1〜50文字)", example = "鈴木 太郎")
    @NotBlank
    @Size(min = 1, max = 50, message = "1〜50文字で入力してください")
    private String displayName;

    @Schema(description = "自己紹介文 (最大160文字)", example = "東京在住のエンジニアです")
    @Size(max = 160, message = "160文字以内で入力してください")
    private String bio;
}
