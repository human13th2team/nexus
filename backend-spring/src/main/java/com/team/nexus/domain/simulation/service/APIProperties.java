package com.team.nexus.domain.simulation.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@ConfigurationProperties(prefix = "api")
@Component
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class APIProperties {
    // 공공데이터포탈 api
    private final DataPortal dataPortal = new DataPortal();
    // 카카오지도 api
    private final Kakao kakao = new Kakao();

    @Getter
    @Setter
    public static class DataPortal {
        private String key;
        private String realEstateUrl;
        private String semasUrl;
    }

    @Getter
    @Setter
    public static class Kakao {
        private String key;
        private String url;
    }
}
