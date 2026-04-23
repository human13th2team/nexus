package com.team.nexus.domain.branding.dto;

import com.team.nexus.global.entity.Branding;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class BrandingListDto {
    private UUID id;
    private String title;
    private UUID industryCategoryId;
    private String currentStep;

    public static BrandingListDto fromEntity(Branding branding) {
        return BrandingListDto.builder()
                .id(branding.getId())
                .title(branding.getTitle())
                .industryCategoryId(branding.getIndustryCategoryId())
                .currentStep(branding.getCurrentStep())
                .build();
    }
}
