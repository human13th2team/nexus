package com.team.nexus.domain.branding.service;

import com.team.nexus.domain.branding.dto.BrandingListDto;
import com.team.nexus.domain.branding.repository.BrandingRepository;
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

    @Override
    public List<BrandingListDto> getBrandingList(UUID userId) {
        return brandingRepository.findByUserId(userId).stream()
                .map(BrandingListDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public Branding getBrandingDetail(UUID id) {
        return brandingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Branding not found"));
    }
}
