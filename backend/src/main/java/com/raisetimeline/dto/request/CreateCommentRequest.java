package com.raisetimeline.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCommentRequest {

    @NotBlank(message = "コメントは必須です")
    @Size(max = 280, message = "コメントは280文字以内で入力してください")
    private String content;
}
