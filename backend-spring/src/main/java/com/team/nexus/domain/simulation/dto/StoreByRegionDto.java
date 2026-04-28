package com.team.nexus.domain.simulation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreByRegionDto {
    // 행정동 코드
    @JsonProperty("region_code")
    private Integer regionCode;
    // 행정동 국문명
    @JsonProperty("region_name")
    private String regionName;
    // 업소수
    private Integer storeCount;
    // 위도
    private Double latitude;
    // 경도
    private Double longitude;
}
