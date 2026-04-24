package com.team.nexus.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "로그인 응답 데이터")
public class LoginResponseDto {

    @Schema(description = "JWT 엑세스 토큰")
    private String accessToken;

    @Schema(description = "사용자 닉네임")
    private String nickname;

    @Schema(description = "사용자 고유 ID")
    private String userId;

    @Schema(description = "사용자 유형 (0: 일반, 1: 사업가)")
    private int userType;
}
