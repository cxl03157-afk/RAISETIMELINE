package com.raisetimeline.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefreshTokenRequest {

    @NotBlank(message = "リフレッシュトークンは必須です")
    private String refreshToken;
}
