package com.team.nexus.domain.branding.service;

import com.team.nexus.domain.branding.dto.BrandingListDto;
import com.team.nexus.global.entity.Branding;

import java.util.List;
import java.util.UUID;

public interface BrandingService {
    List<BrandingListDto> getBrandingList(UUID userId);

    Branding getBrandingDetail(UUID id);
}
