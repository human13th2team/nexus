package com.team.nexus.domain.grouppurchase.controller;

import com.team.nexus.domain.grouppurchase.dto.GroupPurchaseRequestDto;
import com.team.nexus.domain.grouppurchase.dto.GroupPurchaseResponseDto;
import com.team.nexus.domain.grouppurchase.service.GroupPurchaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Tag(name = "GroupPurchase", description = "공동구매 관리 API")
@RestController
@RequestMapping("/api/v1/group-buys")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class GroupPurchaseController {

    private final GroupPurchaseService groupPurchaseService;

    @Operation(summary = "공동구매 등록", description = "새로운 공동구매 항목을 등록합니다.")
    @PostMapping
    public ResponseEntity<GroupPurchaseResponseDto> createGroupPurchase(
            @RequestBody GroupPurchaseRequestDto requestDto,
            @RequestParam UUID userId) {
        return ResponseEntity.ok(groupPurchaseService.createGroupPurchase(requestDto, userId));
    }

    @Operation(summary = "공동구매 목록 조회", description = "전체 공동구매 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<List<GroupPurchaseResponseDto>> getAllGroupPurchases() {
        return ResponseEntity.ok(groupPurchaseService.getAllGroupPurchases());
    }

    @Operation(summary = "공동구매 상세 조회", description = "특정 공동구매 항목의 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<GroupPurchaseResponseDto> getGroupPurchase(@PathVariable UUID id) {
        return ResponseEntity.ok(groupPurchaseService.getGroupPurchase(id));
    }

    @Operation(summary = "공동구매 참여(결제)", description = "특정 공동구매에 참여하고 결제 정보를 기록합니다.")
    @PostMapping("/{id}/participate")
    public ResponseEntity<Void> participate(
            @PathVariable UUID id,
            @RequestParam UUID userId,
            @RequestBody com.team.nexus.domain.grouppurchase.dto.GroupOrderRequestDto orderDto) {
        groupPurchaseService.participate(id, userId, orderDto);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "이미지 업로드", description = "공동구매 물품 이미지를 업로드합니다.")
    @PostMapping("/upload")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        String uploadDir = "uploads/group-buys/";
        Path uploadPath = Paths.get(uploadDir);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        // Return the accessible URL
        return ResponseEntity.ok("http://localhost:8080/uploads/group-buys/" + fileName);
    }
}
