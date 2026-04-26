package com.team.nexus.domain.grouppurchase.repository;

import com.team.nexus.global.entity.GroupOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GroupOrderRepository extends JpaRepository<GroupOrder, String> {
    boolean existsByGroupPurchaseIdAndUserId(UUID gpId, UUID userId);
    List<GroupOrder> findAllByGroupPurchaseId(UUID gpId);
}
