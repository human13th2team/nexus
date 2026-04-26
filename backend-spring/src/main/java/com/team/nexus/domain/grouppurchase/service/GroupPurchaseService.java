package com.team.nexus.domain.grouppurchase.service;

import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.domain.grouppurchase.dto.GroupPurchaseRequestDto;
import com.team.nexus.domain.grouppurchase.dto.GroupPurchaseResponseDto;
import com.team.nexus.domain.grouppurchase.repository.GroupOrderRepository;
import com.team.nexus.domain.grouppurchase.repository.GroupPurchaseRepository;
import com.team.nexus.global.entity.GroupPurchase;
import com.team.nexus.global.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupPurchaseService {

    private final GroupPurchaseRepository groupPurchaseRepository;
    private final GroupOrderRepository groupOrderRepository;
    private final UserRepository userRepository;

    @Transactional
    public GroupPurchaseResponseDto createGroupPurchase(GroupPurchaseRequestDto requestDto, UUID userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        GroupPurchase groupPurchase = GroupPurchase.builder()
                .user(creator)
                .title(requestDto.getTitle())
                .itemName(requestDto.getItemName())
                .itemPrice(requestDto.getItemPrice())
                .targetCount(requestDto.getTargetCount())
                .currentCount(0)
                .startDate(LocalDateTime.now())
                .endDate(requestDto.getEndDate())
                .status("RECRUITING")
                .description(requestDto.getDescription())
                .imageUrl(requestDto.getImageUrl())
                .region(requestDto.getRegion())
                .build();

        GroupPurchase saved = groupPurchaseRepository.save(groupPurchase);
        return convertToDto(saved);
    }

    public List<GroupPurchaseResponseDto> getAllGroupPurchases() {
        return groupPurchaseRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public GroupPurchaseResponseDto getGroupPurchase(UUID id) {
        GroupPurchase groupPurchase = groupPurchaseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group purchase not found"));
        return convertToDto(groupPurchase);
    }

    @Transactional
    public void participate(UUID groupBuyId, UUID userId, com.team.nexus.domain.grouppurchase.dto.GroupOrderRequestDto orderDto) {
        // 중복 참여 체크
        if (groupOrderRepository.existsByGroupPurchaseIdAndUserId(groupBuyId, userId)) {
            throw new RuntimeException("이미 참여한 공동구매입니다.");
        }

        GroupPurchase groupPurchase = groupPurchaseRepository.findById(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("Group purchase not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Create Order
        com.team.nexus.global.entity.GroupOrder order = com.team.nexus.global.entity.GroupOrder.builder()
                .id(UUID.randomUUID().toString())
                .groupPurchase(groupPurchase)
                .user(user)
                .orderCount(orderDto.getOrderCount())
                .totalPrice(groupPurchase.getItemPrice() * orderDto.getOrderCount())
                .pgProvider(orderDto.getPgProvider())
                .paymentStatus("PAID") // Simplified for now
                .paidAt(LocalDateTime.now())
                .build();

        groupOrderRepository.save(order);

        // Update current count
        groupPurchase.setCurrentCount(groupPurchase.getCurrentCount() + orderDto.getOrderCount());
        
        // Check if target reached
        if (groupPurchase.getCurrentCount() >= groupPurchase.getTargetCount()) {
            groupPurchase.setStatus("COMPLETED");
        }
        
        groupPurchaseRepository.save(groupPurchase);
    }

    private GroupPurchaseResponseDto convertToDto(GroupPurchase entity) {
        return GroupPurchaseResponseDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .itemName(entity.getItemName())
                .itemPrice(entity.getItemPrice())
                .targetCount(entity.getTargetCount())
                .currentCount(entity.getCurrentCount())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .status(entity.getStatus())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .region(entity.getRegion())
                .creatorNickname(entity.getUser().getNickname())
                .build();
    }
}
