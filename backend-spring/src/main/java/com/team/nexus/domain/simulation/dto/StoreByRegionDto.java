package com.team.nexus.domain.simulation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreByRegionDto {
    // 행정동 코드 (8자리)
    // 변수명은 api명에 맞춤
    @JsonProperty("region_code")
    private String adongCd;
    // 행정동 이름
    @JsonProperty("region_name")
    private String adongNm;
    // 업소수
    private Integer count;
    // 행정동 경계 좌표
    private JsonNode geometry;
}
