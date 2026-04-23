package com.team.nexus.domain.board.controller;

import com.team.nexus.domain.board.dto.BoardCreateRequestDto;
import com.team.nexus.domain.board.dto.BoardResponseDto;
import com.team.nexus.domain.board.service.BoardService;
import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.global.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Tag(name = "Board", description = "자유게시판 관련 API")
@RestController
@RequestMapping("/api/v1/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;
    private final UserRepository userRepository; // For temporary user fetching if auth is not fully set up

    @Operation(summary = "게시글 목록 조회", description = "자유게시판 게시글 목록을 페이징하여 조회합니다. (내림차순)")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getBoardList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<BoardResponseDto> boardPage = boardService.getBoardList(page, size);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", boardPage.getContent());
        response.put("currentPage", boardPage.getNumber());
        response.put("totalPages", boardPage.getTotalPages());
        response.put("totalElements", boardPage.getTotalElements());
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "인기 게시글 조회", description = "조회수가 높은 상위 3개의 게시글을 조회합니다.")
    @GetMapping("/top")
    public ResponseEntity<Map<String, Object>> getTopPosts() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", boardService.getTopPosts());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "게시글 상세 조회", description = "특정 게시글의 상세 내용을 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPostDetail(@PathVariable java.util.UUID id) {
        Map<String, Object> response = new HashMap<>();
        try {
            BoardResponseDto postDetail = boardService.getPostDetail(id);
            
            response.put("status", "success");
            response.put("data", postDetail);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "게시글 작성", description = "새로운 게시글을 작성합니다.")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createPost(
            @RequestBody BoardCreateRequestDto requestDto,
            @AuthenticationPrincipal String email) { // email comes from JWT filter (to be added)
        
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
}
