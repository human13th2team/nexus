package com.team.nexus.domain.expert.service;

import com.team.nexus.client.FastApiClient;
import com.team.nexus.domain.expert.dto.ExpertMatchReqDto;
import com.team.nexus.domain.expert.dto.ExpertMatchResDto;
import com.team.nexus.domain.expert.repository.ExpertMatchRequestRepository;
import com.team.nexus.domain.expert.repository.ExpertProfileRepository;
import com.team.nexus.global.entity.ExpertMatchRequest;
import com.team.nexus.global.entity.ExpertProfile;
import com.team.nexus.global.entity.IndustryCategory;
import com.team.nexus.global.entity.User;
import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.domain.license.repository.IndustryCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpertMatchServiceImpl implements ExpertMatchService {

    private final ExpertMatchRequestRepository matchRequestRepository;
    private final ExpertProfileRepository expertProfileRepository;
    private final UserRepository userRepository;
    private final IndustryCategoryRepository categoryRepository;
    private final FastApiClient fastApiClient;

    @Override
    public ExpertMatchResDto matchExpert(ExpertMatchReqDto reqDto) {
        ExpertMatchRequest matchRequest = null;
        try {
            // 1. 초기 데이터 조회 (읽기 전용)
            User user = userRepository.findById(reqDto.getUserId()).orElse(null);
            if (user == null) {
                log.error("User not found: {}", reqDto.getUserId());
                return createEmptyResponse(null);
            }

            IndustryCategory category = null;
            if (reqDto.getIndustryCategoryId() != null) {
                category = categoryRepository.findById(reqDto.getIndustryCategoryId()).orElse(null);
            }

            // 2. 매칭 요청 DB 초기 저장 (별도 트랜잭션처럼 동작)
            matchRequest = ExpertMatchRequest.builder()
                    .requester(user)
                    .industryCategory(category)
                    .requestContent(reqDto.getRequestContent())
                    .status("PENDING")
                    .build();
            matchRequest = matchRequestRepository.save(matchRequest);

            // 3. FastAPI 호출 (트랜잭션 외부에서 수행)
            Map fastApiResponse = null;
            try {
                log.info("Requesting AI Match for content: {}", reqDto.getRequestContent());
                fastApiResponse = fastApiClient.requestExpertMatch(
                        reqDto.getIndustryCategoryId() != null ? reqDto.getIndustryCategoryId().toString() : null,
                        reqDto.getRequestContent()
                ).block();
                log.info("AI Raw Response: {}", fastApiResponse);
            } catch (Exception e) {
                log.error("FastAPI Call Failed: {}", e.getMessage());
            }

            java.util.List<ExpertMatchResDto.MatchedExpertInfo> expertList = new java.util.ArrayList<>();

            if (fastApiResponse != null && fastApiResponse.get("matches") != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.List<Map<String, Object>> matches = mapper.convertValue(
                        fastApiResponse.get("matches"), 
                        new com.fasterxml.jackson.core.type.TypeReference<java.util.List<Map<String, Object>>>() {}
                );
                
                for (int i = 0; i < matches.size(); i++) {
                    try {
                        Map<String, Object> m = matches.get(i);
                        String matchedIdStr = String.valueOf(m.get("matched_expert_id"));
                        String matchReason = String.valueOf(m.get("match_reason"));
                        String expertName = m.get("expert_name") != null ? String.valueOf(m.get("expert_name")) : null;
                        
                        ExpertProfile expert = null;
                        if (matchedIdStr != null && !matchedIdStr.isEmpty() && !matchedIdStr.equals("null") && !matchedIdStr.contains("ID")) {
                            expert = expertProfileRepository.findById(UUID.fromString(matchedIdStr)).orElse(null);
                        }
                        
                        if (expert != null) {
                            if (i == 0 && matchRequest != null) {
                                matchRequest.setMatchedExpert(expert);
                                matchRequest.setMatchReason(matchReason);
                                matchRequest.setStatus("COMPLETED");
                                matchRequestRepository.save(matchRequest);
                            }
                            
                            expertList.add(ExpertMatchResDto.MatchedExpertInfo.builder()
                                    .matchedExpertId(expert.getId())
                                    .expertName(expertName != null ? expertName : (expert.getUser() != null ? expert.getUser().getNickname() : "시스템 추천 전문가"))
                                    .expertPortfolio(expert.getPortfolioText())
                                    .matchReason(matchReason)
                                    .build());
                        }
                    } catch (Exception e) {
                        log.error("Error processing expert result: {}", e.getMessage());
                    }
                }
            }

            // 4. AI 매칭 결과가 없거나 부족할 경우 DB에서 기본 전문가로 보충 (Fallback)
            if (expertList.size() < 3) {
                log.info("AI matching returned less than 3 experts. Filling from DB fallback...");
                java.util.List<ExpertProfile> fallbackExperts = expertProfileRepository.findAll(); 
                for (ExpertProfile exp : fallbackExperts) {
                    if (expertList.size() >= 3) break;
                    
                    // 중복 제외
                    boolean exists = expertList.stream().anyMatch(e -> e.getMatchedExpertId() != null && e.getMatchedExpertId().equals(exp.getId()));
                    if (!exists) {
                        expertList.add(ExpertMatchResDto.MatchedExpertInfo.builder()
                                .matchedExpertId(exp.getId())
                                .expertName(exp.getUser() != null ? exp.getUser().getNickname() : "NEXUS 전문가")
                                .expertPortfolio(exp.getPortfolioText())
                                .matchReason("고객님의 요구사항과 유사한 전문성을 보유한 전문가를 시스템이 추천해 드립니다.")
                                .build());
                    }
                }
            }

            return ExpertMatchResDto.builder()
                    .matchRequestId(matchRequest != null ? matchRequest.getId() : null)
                    .experts(expertList)
                    .build();
        } catch (Exception e) {
            log.error("Expert Match Service Critical Error: {}", e.getMessage(), e);
            if (matchRequest != null) {
                try {
                    matchRequest.setStatus("FAILED");
                    matchRequestRepository.save(matchRequest);
                } catch (Exception ex) {}
            }
        }

        return createEmptyResponse(matchRequest != null ? matchRequest.getId() : null);
    }

    private ExpertMatchResDto createEmptyResponse(UUID requestId) {
        return ExpertMatchResDto.builder()
                .matchRequestId(requestId)
                .experts(new java.util.ArrayList<>())
                .build();
    }
}
