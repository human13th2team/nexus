package com.team.nexus.domain.comment.service;

import com.team.nexus.domain.comment.dto.CommentRequestDto;
import com.team.nexus.domain.comment.dto.CommentResponseDto;
import com.team.nexus.global.entity.User;

import java.util.List;
import java.util.UUID;

public interface CommentService {
    void createComment(UUID boardId, CommentRequestDto requestDto, User user);
    List<CommentResponseDto> getCommentsByBoard(UUID boardId);
    void reportComment(UUID commentId, User user);
    void deleteComment(UUID id, String email);
    com.team.nexus.domain.comment.dto.CommentResponseDto updateComment(UUID id, com.team.nexus.domain.comment.dto.CommentUpdateRequestDto request, String email);
}
