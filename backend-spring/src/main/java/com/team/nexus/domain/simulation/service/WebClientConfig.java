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
    public WebClient realEstateWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl(apiProperties.getUrl())
                .build();
    }
}
