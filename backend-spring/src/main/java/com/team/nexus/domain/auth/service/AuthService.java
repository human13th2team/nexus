package com.team.nexus.domain.auth.service;

import com.team.nexus.domain.auth.dto.LoginRequest;
import com.team.nexus.domain.auth.dto.LoginResponse;
import com.team.nexus.domain.auth.dto.PasswordResetRequest;
import com.team.nexus.domain.auth.dto.PasswordResetResponse;
import com.team.nexus.domain.auth.dto.SignupRequest;

public interface AuthService {
    void signup(SignupRequest request);
    LoginResponse login(LoginRequest request);
    PasswordResetResponse resetPassword(PasswordResetRequest request);
}
