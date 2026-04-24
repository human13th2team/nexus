package com.team.nexus.global.config;

import com.team.nexus.global.security.handler.OAuth2SuccessHandler;
import com.team.nexus.global.security.service.CustomOAuth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // API 서버이므로 CSRF 비활성화
            .authorizeHttpRequests(auth -> auth
<<<<<<< Updated upstream
                .requestMatchers("/api/v1/auth/**", "/api/v1/status/**", "/api/v1/comm/**", "/login/oauth2/**", "/oauth2/**").permitAll() // 인증 관련 및 OAuth2 경로 허용
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll() // Swagger 허용
=======
                .requestMatchers(new AntPathRequestMatcher("/api/v1/auth/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/v1/status/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/v1/board/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/v1/region-board/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/v1/comments/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/v1/comm/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/login/oauth2/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/oauth2/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/v3/api-docs/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/swagger-ui/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/swagger-ui.html")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/error")).permitAll()
>>>>>>> Stashed changes
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                .successHandler(oAuth2SuccessHandler)
            );

        return http.build();
    }
}
