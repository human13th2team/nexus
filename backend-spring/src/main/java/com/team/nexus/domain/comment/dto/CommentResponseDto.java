package com.team.nexus.domain.comment.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponseDto {
    private UUID id;
    private String content;
    private String author;
    private UUID boardId;
    private UUID authorId;
    private UUID parentId;
    private LocalDateTime createdAt;
    private Integer reportCount;
    private List<CommentResponseDto> children;
}
