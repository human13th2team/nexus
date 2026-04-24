package com.team.nexus.domain.simulation.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@ConfigurationProperties(prefix = "api.real-estate")
@Component
@Getter
@Setter
public class APIProperties {
    private String key;
    private String url;
}
