package com.team.nexus.domain.comment.service;

import com.team.nexus.domain.board.repository.BoardRepository;
import com.team.nexus.domain.comment.dto.CommentRequestDto;
import com.team.nexus.domain.comment.dto.CommentResponseDto;
import com.team.nexus.domain.comment.repository.CommentReportRepository;
import com.team.nexus.domain.comment.repository.CommentRepository;
import com.team.nexus.global.entity.Board;
import com.team.nexus.global.entity.Comment;
import com.team.nexus.global.entity.CommentReport;
import com.team.nexus.global.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final BoardRepository boardRepository;
    private final CommentReportRepository commentReportRepository;

    @Override
    @Transactional
    public void createComment(UUID boardId, CommentRequestDto requestDto, User user) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        Comment parent = null;
        if (requestDto.getParentId() != null) {
            parent = commentRepository.findById(requestDto.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글을 찾을 수 없습니다."));
        }

        Comment comment = Comment.builder()
                .board(board)
                .user(user)
                .content(requestDto.getContent())
                .parent(parent)
                .reportCount(0)
                .build();

        commentRepository.save(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getCommentsByBoard(UUID boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        List<Comment> topLevelComments = commentRepository.findAllByBoardAndParentIsNullOrderByCreatedAtAsc(board);
        return topLevelComments.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void reportComment(UUID commentId, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        
        if (comment.getUser() != null && comment.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("자신의 댓글은 신고할 수 없습니다.");
        }

        if (commentReportRepository.existsByCommentAndUser(comment, user)) {
            throw new IllegalStateException("이미 신고한 댓글입니다.");
        }

        CommentReport report = CommentReport.builder()
                .comment(comment)
                .user(user)
                .build();
        
        commentReportRepository.save(report);

        comment.setReportCount((comment.getReportCount() == null ? 0 : comment.getReportCount()) + 1);
        commentRepository.save(comment);
    }

    private CommentResponseDto convertToDto(Comment comment) {
        boolean isReported = comment.getReportCount() != null && comment.getReportCount() >= 3;
        
        return CommentResponseDto.builder()
                .id(comment.getId())
                .content(isReported ? "삭제된 댓글입니다." : comment.getContent())
                .author(isReported ? "---" : (comment.getUser() != null ? comment.getUser().getNickname() : "알 수 없음"))
                .createdAt(comment.getCreatedAt())
                .reportCount(comment.getReportCount())
                .children(comment.getChildren().stream()
                        .map(this::convertToDto)
                        .collect(Collectors.toList()))
                .build();
    }
}
