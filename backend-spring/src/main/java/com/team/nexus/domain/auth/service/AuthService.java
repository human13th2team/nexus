package com.team.nexus.domain.auth.service;

import com.team.nexus.domain.auth.dto.SignupRequest;
import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.global.entity.User;
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

    @Transactional
    public void signup(SignupRequest request) {
        // 1. 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            log.error("이미 존재하는 이메일입니다: {}", request.getEmail());
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 2. 사용자 객체 생성 (비밀번호 암호화 적용)
        User user = User.builder()
                .email(request.getEmail())
                .passwd(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .address(request.getAddress())
                .userType(request.getUserType())
                .bizNo(request.getUserType() == 1 ? request.getBizNo() : null)
                .loginType(0) // 0: 일반 이메일 로그인
                .build();

        // 3. 저장
        userRepository.save(user);
        log.info("회원가입 성공: {}", request.getEmail());
    }
}
