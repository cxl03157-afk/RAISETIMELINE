package com.raisetimeline.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "投稿作成・更新リクエスト")
public class CreatePostRequest {

    @Schema(description = "投稿本文 (最大280文字)", example = "今日もコーディング頑張ります！")
    @NotBlank(message = "本文は必須です")
    @Size(max = 280, message = "本文は280文字以内で入力してください")
    private String content;
}
