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
import java.util.Map;
import java.util.UUID;

@Tag(name = "Industry Board", description = "업종별 게시판 관련 API")
@RestController
@RequestMapping("/api/v1/industry-board")
@RequiredArgsConstructor
public class IndustryBoardController {

    private final BoardService boardService;

    @Operation(summary = "업종별 게시글 목록 조회", description = "특정 업종의 게시글 목록을 페이징하여 조회합니다.")
    @GetMapping("/{categoryId}")
    public ResponseEntity<Map<String, Object>> getIndustryBoardList(
            @PathVariable UUID categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "all") String type) {
        
        Page<BoardResponseDto> boardPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            boardPage = boardService.searchIndustryPosts(categoryId, keyword, type, page, size);
        } else {
            boardPage = boardService.getIndustryBoardList(categoryId, page, size);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", boardPage.getContent());
        response.put("currentPage", boardPage.getNumber());
        response.put("totalPages", boardPage.getTotalPages());
        response.put("totalElements", boardPage.getTotalElements());
        
        return ResponseEntity.ok(response);
    }
}
