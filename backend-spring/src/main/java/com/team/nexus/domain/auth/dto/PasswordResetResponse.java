package com.team.nexus.domain.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PasswordResetResponse {
    private String temporaryPassword;
}
