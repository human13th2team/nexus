package com.team.nexus.domain.branding.repository;

import com.team.nexus.global.entity.BrandIdentity;
import com.team.nexus.global.entity.Branding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BrandIdentityRepository extends JpaRepository<BrandIdentity, UUID> {
    List<BrandIdentity> findByBranding(Branding branding);
    List<BrandIdentity> findByBrandingId(UUID brandingId);
}
