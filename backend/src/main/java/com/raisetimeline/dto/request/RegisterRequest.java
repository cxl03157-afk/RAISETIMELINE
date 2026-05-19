package com.raisetimeline.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank
    @Pattern(regexp = "^[a-zA-Z0-9_]{3,20}$",
             message = "3〜20文字の英数字とアンダースコアのみ使えます")
    private String username;

    @NotBlank
    @Size(min = 1, max = 50, message = "1〜50文字で入力してください")
    private String displayName;

    @NotBlank
    @Email(message = "正しいメールアドレスを入力してください")
    private String email;

    @NotBlank
    @Size(min = 8, message = "パスワードは8文字以上にしてください")
    private String password;
}
