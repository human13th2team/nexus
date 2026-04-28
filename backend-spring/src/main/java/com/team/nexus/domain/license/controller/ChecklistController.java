package com.team.nexus.domain.license.controller;

import com.team.nexus.domain.license.dto.*;
import com.team.nexus.domain.license.service.LicenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/checklist")
@RequiredArgsConstructor
public class ChecklistController {
    private final LicenseService licenseService;

    @PostMapping("/create")
    public ResponseEntity<ChecklistResponseDto> createChecklist(
            @RequestBody ChecklistRequestDto request) {
        return ResponseEntity.ok(licenseService.createChecklist(request));
    }
}
