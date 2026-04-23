package com.team.nexus.domain.board.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardResponseDto {
    private UUID id;
    private String title;
    private String author;
    private String content;
    private String imageUrl;
    private LocalDateTime createdAt;
    private Integer viewCount;
}
