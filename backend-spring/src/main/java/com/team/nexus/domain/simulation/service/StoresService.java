package com.team.nexus.domain.simulation.service;

import com.team.nexus.domain.simulation.dto.StoresResponseDto;

public interface StoresService {
    StoresResponseDto getStoreList(String semasKsicCode);
}
