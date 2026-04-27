package com.team.nexus.domain.simulation.service;

import com.team.nexus.domain.simulation.dto.SemasAPIDto;
import com.team.nexus.domain.simulation.dto.StoreByRegionDto;
import com.team.nexus.domain.simulation.dto.StoresResponseDto;
import com.team.nexus.domain.simulation.repository.RegionCodeRepository;
import com.team.nexus.global.entity.RegionCode;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StoresServiceImpl implements StoresService {
    private final RegionCodeRepository regionCodeRepository;
    private final APIProperties apiProperties;
    private final WebClient dataPortalSemasWebClient;

    // Server-side In-memory Cache
    private static final java.util.Map<String, List<StoreByRegionDto>> cache = new java.util.concurrent.ConcurrentHashMap<>();

    private StoresResponseDto processRanking(List<StoreByRegionDto> storeByRegionDtoList) {
        if (storeByRegionDtoList == null || storeByRegionDtoList.isEmpty()) {
            return new StoresResponseDto();
        }
        int totalStoreCount = storeByRegionDtoList.stream()
                        .mapToInt(StoreByRegionDto::getStoreCount)
                                .sum();
        double avgStoreCount = (double) totalStoreCount / storeByRegionDtoList.size();
        storeByRegionDtoList.sort(Comparator.comparing(StoreByRegionDto::getStoreCount).reversed());
        List<StoreByRegionDto> topRegions = storeByRegionDtoList.stream()
                .limit(3)
                .toList();
        List<StoreByRegionDto> bottomRegions = storeByRegionDtoList.stream()
                .sorted(Comparator.comparing(StoreByRegionDto::getStoreCount))
                .limit(3)
                .toList();
        return StoresResponseDto.builder()
                .storeByRegionDtoList(storeByRegionDtoList)
                .totalStoreCount(totalStoreCount)
                .avgStoreCount(avgStoreCount)
                .topRegions(topRegions)
                .bottomRegions(bottomRegions)
                .build();
    }

    @Override
    @Transactional
    public StoresResponseDto getStoreList(String semasKsicCode) {
        // 1. 캐시 확인
        if (cache.containsKey(semasKsicCode)) {
            System.out.println("[Cache Hit] Returning cached data for: " + semasKsicCode);
            return processRanking(new java.util.ArrayList<>(cache.get(semasKsicCode)));
        }

        List<RegionCode> regionCodeList = regionCodeRepository.findAll();

        List<StoreByRegionDto> storeByRegionDtoList = Flux.fromIterable(regionCodeList)
                .flatMap(region -> dataPortalSemasWebClient.get().uri(uriBuilder ->
                        uriBuilder.queryParam("ServiceKey", apiProperties.getDataPortal().getKey())
                                .queryParam("pageNo", 1)
                                .queryParam("numOfRows", 1)
                                .queryParam("divId", "signguCd")
                                .queryParam("key", region.getRegionCode())
                                .queryParam("indsSclsCd", semasKsicCode)
                                .queryParam("type", "json")
                                .build())
                        .retrieve()
                        .bodyToMono(SemasAPIDto.class)
                        .timeout(java.time.Duration.ofSeconds(5))
                        .retryWhen(reactor.util.retry.Retry.backoff(2, java.time.Duration.ofMillis(200)))
                        .map(response -> {
                            Integer count = 0;
                            if (response != null && response.getBody() != null && response.getBody().getTotalCount() != null) {
                                count = response.getBody().getTotalCount();
                            }
                            return StoreByRegionDto.builder()
                                    .regionCode(region.getRegionCode())
                                    .regionName(region.getCityName() + " " + region.getCountyName())
                                    .storeCount(count)
                                    .latitude(region.getLatitude())
                                    .longitude(region.getLongitude())
                                    .build();
                        })
                        .onErrorResume(e -> {
                            System.err.println("API Error for region " + region.getCountyName() + ": " + e.getMessage());
                            return reactor.core.publisher.Mono.just(StoreByRegionDto.builder()
                                    .regionCode(region.getRegionCode())
                                    .regionName(region.getCityName() + " " + region.getCountyName())
                                    .storeCount(0)
                                    .latitude(region.getLatitude())
                                    .longitude(region.getLongitude())
                                    .build());
                        }),
                        50 // Concurrency 상향
                )
                .subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic())
                .collectList()
                .block();
        
        // 2. 캐시 저장
        if (storeByRegionDtoList != null) {
            cache.put(semasKsicCode, storeByRegionDtoList);
        }

        return processRanking(storeByRegionDtoList);
    }

}
