package com.team.nexus.domain.grouppurchase.repository;

import com.team.nexus.global.entity.GroupPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface GroupPurchaseRepository extends JpaRepository<GroupPurchase, UUID> {
    List<GroupPurchase> findAllByStatusAndEndDateBefore(String status, LocalDateTime now);
}
