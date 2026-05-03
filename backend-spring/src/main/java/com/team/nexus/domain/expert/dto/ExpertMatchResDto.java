package com.team.nexus.domain.expert.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

import java.util.List;

@Data
@Builder
public class ExpertMatchResDto {
    private UUID matchRequestId;
    private List<MatchedExpertInfo> experts;

    @Data
    @Builder
    public static class MatchedExpertInfo {
        private UUID matchedExpertId;
        private String expertName;
        private String expertPortfolio;
        private String matchReason;
    }
}
