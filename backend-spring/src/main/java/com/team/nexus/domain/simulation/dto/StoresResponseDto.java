package com.team.nexus.domain.simulation.dto;

import lombok.*;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// markets GET 요청 응답
public class StoresResponseDto {
    // 지역별 업소 리스트
    private List<StoreByRegionDto> storeByRegionDtoList;
    // 전체 업소 수
    private Integer totalStoreCount;
    // 평균 업소 수
    private Double avgStoreCount;
    // 가장 적은 지역(top-3)
    private List<StoreByRegionDto> topRegions;
    // 가장 많은 지역(top-3)
    private List<StoreByRegionDto> bottomRegions;
}
