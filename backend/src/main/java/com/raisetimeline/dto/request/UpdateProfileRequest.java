package com.raisetimeline.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @NotBlank
    @Size(min = 1, max = 50, message = "1〜50文字で入力してください")
    private String displayName;

    @Size(max = 160, message = "160文字以内で入力してください")
    private String bio;
}
