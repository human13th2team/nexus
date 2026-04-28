package com.team.nexus.domain.simulation.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@RequiredArgsConstructor
public class WebClientConfig {
    private final APIProperties apiProperties;

    @Bean
    public WebClient dataPortalRealEstateWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl(apiProperties.getDataPortal().getRealEstateUrl())
                .build();
    }

    @Bean
    public WebClient dataPortalSemasWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl(apiProperties.getDataPortal().getSemasUrl())
                .build();
    }

    @Bean
    public WebClient kakaoWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl(apiProperties.getKakao().getUrl())
                .defaultHeader("Authorization", "KakaoAK" + apiProperties.getKakao().getKey())
                .build();
    }
}
