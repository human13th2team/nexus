package com.team.nexus.domain.simulation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor

// semas_category_mappings 테이블에서 필요한 속성 (업종명, ksic 코드)
public class SimIndustCatsDto {
    private String address_name;
    private String ksicCode;
}
