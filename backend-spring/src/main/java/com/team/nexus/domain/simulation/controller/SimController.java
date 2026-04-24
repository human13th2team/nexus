package com.team.nexus.domain.simulation.controller;

import com.team.nexus.domain.simulation.dto.ProcessedRealEstateDto;
import com.team.nexus.domain.simulation.dto.SimSearchListDto;
import com.team.nexus.domain.simulation.service.RealEstateService;
import com.team.nexus.domain.simulation.service.SimSearchListService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/sim")
@RequiredArgsConstructor
public class SimController {
    private final SimSearchListService simSearchListService;
    private final RealEstateService realEstateService;

    @GetMapping("search-list")
    public ResponseEntity<SimSearchListDto> getSearchList() {
        return ResponseEntity.ok(simSearchListService.getRegionIndustryList());
    }

    @GetMapping("real-estate")
    public ResponseEntity<List<ProcessedRealEstateDto>> getProcessedRealEstateList(@RequestParam(defaultValue = "11110") Integer regionCode){
        return ResponseEntity.ok(realEstateService.getProcessedRealEstateList(regionCode));
    }
    // @GetMapping("equip-price/{category}")
}
