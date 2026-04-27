package com.team.nexus.domain.worker.controller;

import com.team.nexus.domain.worker.dto.WorkerRequestDto;
import com.team.nexus.domain.worker.dto.WorkerResponseDto;
import com.team.nexus.domain.worker.service.WorkerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/worker")
@RequiredArgsConstructor
public class WorkerController {

    private final WorkerService workerService;

    @PostMapping("/calculate")
    public ResponseEntity<WorkerResponseDto> calculate(
            @RequestBody WorkerRequestDto request) {
        return ResponseEntity.ok(workerService.calculate(request));
    }
}
