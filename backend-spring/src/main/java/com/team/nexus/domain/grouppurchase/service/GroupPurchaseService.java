package com.team.nexus.domain.grouppurchase.service;

import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.domain.grouppurchase.dto.GroupPurchaseRequestDto;
import com.team.nexus.domain.grouppurchase.dto.GroupPurchaseResponseDto;
import com.team.nexus.domain.grouppurchase.repository.GroupOrderRepository;
import com.team.nexus.domain.grouppurchase.repository.GroupPurchaseRepository;
import com.team.nexus.global.entity.GroupOrder;
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
@org.springframework.transaction.annotation.Transactional(readOnly = true)
@lombok.extern.slf4j.Slf4j
public class GroupPurchaseService {

    private final GroupPurchaseRepository groupPurchaseRepository;
    private final GroupOrderRepository groupOrderRepository;
    private final UserRepository userRepository;
    private final ExternalApiService externalApiService;
    
    @org.springframework.beans.factory.annotation.Value("${toss.secret-key}")
    private String tossSecretKey;

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
        // 정렬 조건:
        // 1. 상태가 RECRUITING인 것을 먼저 (CASE 사용)
        // 2. RECRUITING 중에서는 마감일(endDate)이 빠른 순
        // 3. 마감된 것들은 나중에
        return groupPurchaseRepository.findAllCustomSorted().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<GroupPurchaseResponseDto> searchGroupPurchases(String itemName, String region) {
        // 검색어가 비어있으면 null로 전달하여 쿼리에서 조건 무시
        String searchItemName = (itemName != null && !itemName.trim().isEmpty()) ? itemName : null;
        String searchRegion = (region != null && !region.trim().isEmpty()) ? region : null;

        return groupPurchaseRepository.searchGroupPurchases(searchItemName, searchRegion).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public GroupPurchaseResponseDto getGroupPurchase(UUID id) {
        GroupPurchase groupPurchase = groupPurchaseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group purchase not found"));
        return convertToDto(groupPurchase);
    }

    public boolean checkParticipation(UUID groupBuyId, UUID userId) {
        boolean exists = groupOrderRepository.existsByGroupPurchaseIdAndUserId(groupBuyId, userId);
        log.info("[Check Participation] GroupBuyId: {}, UserId: {}, Exists: {}", groupBuyId, userId, exists);
        return exists;
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
                .paymentMethod(orderDto.getPaymentMethod())
                .pgTid(orderDto.getPgTid())
                .paymentStatus("PAID")
                .paidAt(LocalDateTime.now())
                .build();

        groupOrderRepository.save(order);

        // Update current count
        groupPurchase.setCurrentCount(groupPurchase.getCurrentCount() + orderDto.getOrderCount());
        
        if (groupPurchase.getCurrentCount() >= groupPurchase.getTargetCount()) {
            groupPurchase.setStatus("COMPLETED");
        }
        
        groupPurchaseRepository.save(groupPurchase);
    }

    @Transactional
    public void confirmPayment(UUID groupBuyId, UUID userId, com.team.nexus.domain.grouppurchase.dto.PaymentConfirmRequestDto confirmDto) {
        // 모의 결제(Mock) 처리: MOCK_으로 시작하면 토스 API 호출 없이 바로 성공 처리
        if (confirmDto.getPaymentKey() != null && confirmDto.getPaymentKey().startsWith("MOCK_")) {
            com.team.nexus.domain.grouppurchase.dto.GroupOrderRequestDto orderDto = new com.team.nexus.domain.grouppurchase.dto.GroupOrderRequestDto();
            orderDto.setOrderCount(1);
            orderDto.setPgProvider("KAKAO_PAY_MOCK");
            orderDto.setPaymentMethod("MOCK_PAYMENT");
            orderDto.setPgTid(confirmDto.getPaymentKey());
            participate(groupBuyId, userId, orderDto);
            return;
        }

        // 1. 토스 결제 승인 API 호출
        String url = "https://api.tosspayments.com/v1/payments/confirm";
        
        // 시크릿 키를 Base64 인코딩하여 Basic Auth 헤더 생성
        String auth = java.util.Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes());
        java.util.Map<String, String> headers = new java.util.HashMap<>();
        headers.put("Authorization", "Basic " + auth);

        java.util.Map<String, Object> body = new java.util.HashMap<>();
        body.put("paymentKey", confirmDto.getPaymentKey());
        body.put("orderId", confirmDto.getOrderId());
        body.put("amount", confirmDto.getAmount());

        try {
            java.util.Map<String, Object> response = externalApiService.post(url, body, headers, java.util.Map.class);
            
            // 2. 응답 데이터에서 정보 추출 (method, provider 등)
            String method = (String) response.get("method"); // 예: 카드, 가상계좌 등
            String pgTid = (String) response.get("paymentKey");
            
            // 카드 결제인 경우 더 구체적인 정보 추출 시도
            String pgProvider = "TOSS";
            if ("카드".equals(method)) {
                java.util.Map<String, Object> card = (java.util.Map<String, Object>) response.get("card");
                if (card != null) {
                    pgProvider = (String) card.get("issuerCode"); // 카드 발급사 코드
                }
            } else if (response.containsKey("easyPay")) {
                java.util.Map<String, Object> easyPay = (java.util.Map<String, Object>) response.get("easyPay");
                if (easyPay != null) {
                    pgProvider = (String) easyPay.get("provider"); // 예: 카카오페이, 토스페이 등
                }
            }

            // 3. 기존 participate 로직을 호출하여 주문 저장
            com.team.nexus.domain.grouppurchase.dto.GroupOrderRequestDto orderDto = new com.team.nexus.domain.grouppurchase.dto.GroupOrderRequestDto();
            orderDto.setOrderCount(1); // 기본 1개로 설정 (추후 확장 가능)
            orderDto.setPgProvider(pgProvider);
            orderDto.setPaymentMethod(method);
            orderDto.setPgTid(pgTid);

            participate(groupBuyId, userId, orderDto);

        } catch (Exception e) {
            throw new RuntimeException("결제 승인 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteGroupPurchase(UUID id, UUID userId) {
        GroupPurchase groupPurchase = groupPurchaseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group purchase not found"));

        // 권한 확인: 등록자만 삭제 가능
        if (!groupPurchase.getUser().getId().equals(userId)) {
            throw new RuntimeException("Only the creator can delete this group purchase.");
        }

        // 1. 환불 처리: 결제된 모든 주문 정보 조회
        List<GroupOrder> orders = groupPurchase.getOrders();
        
        // 토스 인증 헤더 준비
        String auth = java.util.Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes());
        java.util.Map<String, String> headers = new java.util.HashMap<>();
        headers.put("Authorization", "Basic " + auth);
        headers.put("Content-Type", "application/json");

        for (GroupOrder order : orders) {
            // pgTid(결제 키)가 있고, 수동 모의 결제가 아닌 경우 환불 진행
            if (order.getPgTid() != null && !"KAKAO_PAY_MOCK".equals(order.getPgProvider())) {
                try {
                    log.info("Attempting refund for order {}: pgTid={}", order.getId(), order.getPgTid());
                    
                    java.util.Map<String, String> body = new java.util.HashMap<>();
                    body.put("cancelReason", "공동구매 취소로 인한 자동 환불");

                    String cancelUrl = "https://api.tosspayments.com/v1/payments/" + order.getPgTid() + "/cancel";
                    externalApiService.post(cancelUrl, body, headers, String.class);
                    
                    log.info("Successfully refunded order {}", order.getId());
                } catch (Exception e) {
                    log.error("Failed to refund order {}: {}", order.getId(), e.getMessage());
                    // 환불 실패 시에도 로그를 남기고 다음 주문으로 진행하거나, 전체를 중단할지 정책 결정 필요
                    // 일단은 로그를 남기고 진행합니다.
                }
            }
        }

        // 2. 공동구매 삭제 (Cascade 설정으로 orders도 함께 삭제됨)
        groupPurchaseRepository.delete(groupPurchase);
        log.info("Group purchase {} deleted by user {}", id, userId);
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
                .creatorId(entity.getUser().getId())
                .build();
    }

    /**
     * 매 시간 정각에 실행되어 마감 후 1일이 지난 공동구매 삭제
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 * * * *")
    @org.springframework.transaction.annotation.Transactional
    public void cleanupExpiredGroupPurchases() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(1);
        
        // 마감시간이 1일 이상 지난 항목들 조회
        List<GroupPurchase> expiredItems = groupPurchaseRepository.findAllByEndDateBefore(threshold);
        
        if (!expiredItems.isEmpty()) {
            log.info("Cleaning up {} expired group purchases older than {}", expiredItems.size(), threshold);
            groupPurchaseRepository.deleteAll(expiredItems);
        }
    }
}
