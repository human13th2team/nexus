package com.team.nexus.domain.board.controller;

import com.team.nexus.domain.board.service.BoardLikeService;
import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.global.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Tag(name = "BoardLike", description = "게시글 추천 관련 API")
@RestController
@RequestMapping("/api/v1/board/like")
@RequiredArgsConstructor
public class BoardLikeController {

    private final BoardLikeService boardLikeService;
    private final UserRepository userRepository;

    @Operation(summary = "게시글 추천/취소", description = "게시글을 추천하거나 추천을 취소합니다. (토글 방식)")
    @PostMapping("/{boardId}")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable UUID boardId,
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
            
            boolean isLiked = boardLikeService.toggleLike(boardId, user);
            
            response.put("status", "success");
            response.put("isLiked", isLiked);
            response.put("message", isLiked ? "추천되었습니다." : "추천이 취소되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "추천 여부 확인", description = "현재 사용자가 해당 게시글을 추천했는지 확인합니다.")
    @GetMapping("/{boardId}/status")
    public ResponseEntity<Map<String, Object>> getLikeStatus(
            @PathVariable UUID boardId,
            @AuthenticationPrincipal String email) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            if (email == null) {
                response.put("status", "success");
                response.put("isLiked", false);
                return ResponseEntity.ok(response);
            }

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            
            boolean isLiked = boardLikeService.isLiked(boardId, user);
            
            response.put("status", "success");
            response.put("isLiked", isLiked);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
