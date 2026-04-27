package com.team.nexus.domain.branding.service;

import com.team.nexus.domain.branding.dto.BrandIdentityDto;
import com.team.nexus.domain.branding.dto.BrandingDetailDto;
import com.team.nexus.domain.branding.dto.BrandingListDto;
import com.team.nexus.domain.branding.repository.BrandIdentityRepository;
import com.team.nexus.domain.branding.repository.BrandingRepository;
import com.team.nexus.global.entity.BrandIdentity;
import com.team.nexus.global.entity.Branding;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BrandingServiceImpl implements BrandingService {

    private final BrandingRepository brandingRepository;
    private final BrandIdentityRepository brandIdentityRepository;

    @Override
    public List<BrandingListDto> getBrandingList(UUID userId) {
        return brandingRepository.findByUserId(userId).stream()
                .map(branding -> BrandingListDto.builder()
                        .id(branding.getId())
                        .title(branding.getTitle())
                        .industryCategoryId(branding.getIndustryCategoryId())
                        .currentStep(branding.getCurrentStep())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public BrandingDetailDto getBrandingDetail(UUID id) {
        Branding branding = brandingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Branding not found"));
        
        List<BrandIdentity> identities = brandIdentityRepository.findByBranding(branding);
        
        return BrandingDetailDto.builder()
                .id(branding.getId())
                .title(branding.getTitle())
                .industryCategoryId(branding.getIndustryCategoryId())
                .keywords(branding.getKeywords())
                .currentStep(branding.getCurrentStep())
                .identities(identities.stream()
                        .map(identity -> BrandIdentityDto.builder()
                                .id(identity.getId())
                                .brandName(identity.getBrandName())
                                .slogan(identity.getSlogan())
                                .brandStory(identity.getBrandStory())
                                .isSelected(identity.getIsSelected())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    @Override
    @Transactional
    public void deleteBranding(UUID id) {
        if (!brandingRepository.existsById(id)) {
            throw new RuntimeException("Branding not found");
        }
        brandingRepository.deleteById(id);
    }
}
