package com.team.nexus.domain.board.controller;

import com.team.nexus.domain.board.dto.BoardResponseDto;
import com.team.nexus.domain.board.service.BoardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "RegionBoard", description = "지역별 게시판 관련 API")
@RestController
@RequestMapping("/api/v1/region-board")
@RequiredArgsConstructor
public class RegionBoardController {

    private final BoardService boardService;
    private final com.team.nexus.domain.auth.repository.UserRepository userRepository;

    @Operation(summary = "지역별 게시글 목록 조회", description = "특정 지역의 게시글 목록을 페이징하여 조회합니다.")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getRegionBoardList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "all") String type,
            @RequestParam String region) {
        
        Page<BoardResponseDto> boardPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            boardPage = boardService.searchRegionPosts(region, keyword, type, page, size);
        } else {
            boardPage = boardService.getRegionBoardList(region, page, size);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", boardPage.getContent());
        response.put("currentPage", boardPage.getNumber());
        response.put("totalPages", boardPage.getTotalPages());
        response.put("totalElements", boardPage.getTotalElements());
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "지역별 인기 게시글 목록 조회", description = "특정 지역의 인기 게시글(좋아요 10개 이상) 목록을 페이징하여 조회합니다.")
    @GetMapping("/popular")
    public ResponseEntity<Map<String, Object>> getRegionPopularBoardList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam String region) {
        
        Page<BoardResponseDto> boardPage = boardService.getRegionPopularPosts(region, page, size);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", boardPage.getContent());
        response.put("currentPage", boardPage.getNumber());
        response.put("totalPages", boardPage.getTotalPages());
        response.put("totalElements", boardPage.getTotalElements());
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "지역별 조회수 TOP 3 게시글 조회", description = "특정 지역에서 조회수가 가장 높은 상위 3개 게시글을 조회합니다.")
    @GetMapping("/top")
    public ResponseEntity<Map<String, Object>> getRegionTopBoardList(
            @RequestParam String region) {
        
        List<BoardResponseDto> topPosts = boardService.getRegionTopPosts(region);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", topPosts);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "지역별 게시글 작성", description = "특정 지역의 게시판에 새로운 게시글을 작성합니다.")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createRegionPost(
            @RequestBody com.team.nexus.domain.board.dto.BoardCreateRequestDto requestDto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal String email) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            if (email == null) {
                response.put("status", "error");
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }

            if (requestDto.getRegionName() == null || requestDto.getRegionName().trim().isEmpty()) {
                response.put("status", "error");
                response.put("message", "지역 게시판에는 지역 선택이 필수입니다.");
                return ResponseEntity.badRequest().body(response);
            }

            com.team.nexus.global.entity.User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            
            boardService.createPost(requestDto, user);
            
            response.put("status", "success");
            response.put("message", "지역 게시글이 작성되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
