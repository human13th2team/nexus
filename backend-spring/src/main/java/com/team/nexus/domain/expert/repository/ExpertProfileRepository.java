package com.team.nexus.domain.expert.repository;

import com.team.nexus.global.entity.ExpertProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ExpertProfileRepository extends JpaRepository<ExpertProfile, UUID> {
}
