package com.team.nexus.global.security.handler;

import com.team.nexus.global.util.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = "";
        // Google vs Kakao 이메일 추출 로직
        if (attributes.containsKey("email")) {
            email = (String) attributes.get("email");
        } else if (attributes.containsKey("kakao_account")) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            email = (String) kakaoAccount.get("email");
        }

        String token = jwtTokenProvider.createToken(email);
        
        // CustomOAuth2UserService에서 넣은 정보 가져오기
        String userId = attributes.get("userId").toString();
        String nickname = (String) attributes.get("nickname");

        // 어떤 서비스(google, kakao 등)인지 추출
        String provider = ((org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken) authentication)
                .getAuthorizedClientRegistrationId();
        
        log.info("OAuth2 Login Success: {} via {}, Token: {}", email, provider, token);

        // 프론트엔드로 토큰, provider, userId, nickname을 전달하며 리다이렉트
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/auth/oauth-callback")
                .queryParam("token", token)
                .queryParam("provider", provider)
                .queryParam("userId", userId)
                .queryParam("nickname", nickname)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
