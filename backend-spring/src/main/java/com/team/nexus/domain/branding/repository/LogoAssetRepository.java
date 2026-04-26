package com.team.nexus.domain.branding.repository;

import com.team.nexus.global.entity.BrandIdentity;
import com.team.nexus.global.entity.LogoAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface LogoAssetRepository extends JpaRepository<LogoAsset, UUID> {
    List<LogoAsset> findByBrandIdentity(BrandIdentity brandIdentity);
}
