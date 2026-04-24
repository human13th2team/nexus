package com.team.nexus.domain.comment.controller;

import com.team.nexus.domain.comment.dto.CommentRequestDto;
import com.team.nexus.domain.comment.dto.CommentResponseDto;
import com.team.nexus.domain.comment.service.CommentService;
import com.team.nexus.global.entity.User;
import com.team.nexus.domain.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;

    @PostMapping("/{boardId}")
    public ResponseEntity<Map<String, Object>> createComment(
            @PathVariable UUID boardId,
            @RequestBody CommentRequestDto requestDto,
            @AuthenticationPrincipal String email) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            if (email == null) {
                response.put("status", "error");
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            commentService.createComment(boardId, requestDto, user);
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{boardId}")
    public ResponseEntity<Map<String, Object>> getComments(@PathVariable UUID boardId) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<CommentResponseDto> comments = commentService.getCommentsByBoard(boardId);
            response.put("status", "success");
            response.put("data", comments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/report/{commentId}")
    public ResponseEntity<Map<String, Object>> reportComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal String email) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            if (email == null) {
                response.put("status", "error");
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            commentService.reportComment(commentId, user);
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "신고 처리 중 오류가 발생했습니다.");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Map<String, Object>> deleteComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal String email) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            if (email == null) {
                response.put("status", "error");
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            commentService.deleteComment(commentId, user);
            response.put("status", "success");
            response.put("message", "댓글이 삭제되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
