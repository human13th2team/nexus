package com.team.nexus.domain.board.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardUpdateRequestDto {
    private String title;
    private String content;
    private String regionName;
    private String categoryName;
    private Boolean isAnonymous;
    private String imageUrl;
}
