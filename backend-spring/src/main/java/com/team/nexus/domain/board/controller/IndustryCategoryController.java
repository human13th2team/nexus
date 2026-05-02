package com.team.nexus.domain.board.controller;

import com.team.nexus.domain.board.dto.IndustryCategoryResponseDto;
import com.team.nexus.domain.board.service.IndustryCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/industry-categories")
@RequiredArgsConstructor
public class IndustryCategoryController {

    private final IndustryCategoryService industryCategoryService;

    @GetMapping("/main")
    public ResponseEntity<Map<String, Object>> getMainCategories() {
        List<IndustryCategoryResponseDto> categories = industryCategoryService.getMainCategories();
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", categories);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sub/{parentId}")
    public ResponseEntity<Map<String, Object>> getSubCategories(@PathVariable UUID parentId) {
        List<IndustryCategoryResponseDto> categories = industryCategoryService.getSubCategories(parentId);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", categories);
        return ResponseEntity.ok(response);
    }
}
