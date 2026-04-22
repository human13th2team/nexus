package com.team.nexus.domain.auth.service;

import com.team.nexus.domain.auth.dto.LoginRequest;
import com.team.nexus.domain.auth.dto.LoginResponse;
import com.team.nexus.domain.auth.dto.SignupRequest;
import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.global.entity.User;
import com.team.nexus.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public void signup(SignupRequest request) {
        // ... (existing code remains same)
        if (userRepository.existsByEmail(request.getEmail())) {
            log.error("이미 존재하는 이메일입니다: {}", request.getEmail());
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwd(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .address(request.getAddress())
                .userType(request.getUserType())
                .bizNo(request.getUserType() == 1 ? request.getBizNo() : null)
                .loginType(0)
                .build();

        userRepository.save(user);
        log.info("회원가입 성공: {}", request.getEmail());
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // 1. 사용자 조회
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        // 2. 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswd())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 3. 토큰 생성
        String token = jwtTokenProvider.createToken(user.getEmail());

        return LoginResponse.builder()
                .accessToken(token)
                .nickname(user.getNickname())
                .userType(user.getUserType())
                .build();
    }
}
