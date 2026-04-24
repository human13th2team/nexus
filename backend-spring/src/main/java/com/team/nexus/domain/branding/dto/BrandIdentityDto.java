package com.team.nexus.domain.branding.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class BrandIdentityDto {
    private UUID id;
    private String brandName;
    private String slogan;
    private String brandStory;
    private Boolean isSelected;
}
