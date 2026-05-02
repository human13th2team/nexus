package com.team.nexus.domain.board.controller;

import com.team.nexus.domain.board.dto.BoardCreateRequestDto;
import com.team.nexus.domain.board.dto.BoardResponseDto;
import com.team.nexus.domain.board.dto.BoardUpdateRequestDto;
import com.team.nexus.domain.board.service.BoardService;
import com.team.nexus.global.entity.User;
import com.team.nexus.domain.auth.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Board", description = "자유게시판 관련 API")
@RestController
@RequestMapping("/api/v1/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;
    private final UserRepository userRepository;

    @Operation(summary = "게시글 목록 조회", description = "자유게시판의 게시글 목록을 페이징하여 조회합니다.")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getBoardList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "all") String type) {
        
        Page<BoardResponseDto> boardPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            boardPage = boardService.searchPosts(keyword, type, page, size);
        } else {
            boardPage = boardService.getBoardList(page, size);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", boardPage.getContent());
        response.put("currentPage", boardPage.getNumber());
        response.put("totalPages", boardPage.getTotalPages());
        response.put("totalElements", boardPage.getTotalElements());
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "인기 게시글 목록 조회", description = "자유게시판의 인기 게시글(좋아요 10개 이상) 목록을 페이징하여 조회합니다.")
    @GetMapping("/popular")
    public ResponseEntity<Map<String, Object>> getPopularBoardList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<BoardResponseDto> boardPage = boardService.getPopularPosts(page, size);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", boardPage.getContent());
        response.put("currentPage", boardPage.getNumber());
        response.put("totalPages", boardPage.getTotalPages());
        response.put("totalElements", boardPage.getTotalElements());
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "조회수 상위 게시글 조회", description = "자유게시판의 조회수 상위 3개 게시글을 조회합니다.")
    @GetMapping("/top")
    public ResponseEntity<Map<String, Object>> getTopBoardList() {
        List<BoardResponseDto> topPosts = boardService.getTopPosts();
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", topPosts);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "게시글 상세 조회", description = "게시글의 상세 내용을 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPostDetail(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "false") boolean silent) {
        BoardResponseDto postDetail = boardService.getPostDetail(id, !silent);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", postDetail);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "게시글 작성", description = "자유게시판에 새로운 게시글을 작성합니다.")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createPost(
            @RequestBody BoardCreateRequestDto requestDto,
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
            
            boardService.createPost(requestDto, user);
            
            response.put("status", "success");
            response.put("message", "게시글이 작성되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "게시글 수정", description = "게시글을 수정합니다.")
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updatePost(
            @PathVariable UUID id,
            @RequestBody BoardUpdateRequestDto requestDto,
            @AuthenticationPrincipal String email) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            BoardResponseDto updatedPost = boardService.updatePost(id, requestDto, email);
            response.put("status", "success");
            response.put("data", updatedPost);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "게시글 삭제", description = "게시글을 삭제합니다.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePost(
            @PathVariable UUID id,
            @AuthenticationPrincipal String email) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            boardService.deletePost(id, email);
            response.put("status", "success");
            response.put("message", "게시글이 삭제되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "게시글 좋아요 토글", description = "게시글에 좋아요를 누르거나 취소합니다.")
    @PostMapping("/like/{id}")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable UUID id,
            @AuthenticationPrincipal String email) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            boolean isLiked = boardService.toggleLike(id, email);
            response.put("status", "success");
            response.put("isLiked", isLiked);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "게시글 좋아요 상태 확인", description = "현재 사용자의 게시글 좋아요 여부를 확인합니다.")
    @GetMapping("/like/{id}/status")
    public ResponseEntity<Map<String, Object>> getLikeStatus(
            @PathVariable UUID id,
            @AuthenticationPrincipal String email) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            boolean isLiked = boardService.isLiked(id, email);
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
