package com.team.nexus.domain.simulation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.nexus.domain.simulation.dto.SemasAPIDto;
import com.team.nexus.domain.simulation.dto.SemasItemDto;
import com.team.nexus.domain.simulation.dto.StoreByRegionDto;
import com.team.nexus.domain.simulation.dto.StoreMapResponseDto;
import com.team.nexus.domain.simulation.repository.AdministrativeBoundaryRepository;
import com.team.nexus.domain.simulation.repository.RegionCodeRepository;
import com.team.nexus.global.entity.AdministrativeBoundaries;
import com.team.nexus.global.entity.RegionCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoresServiceImpl implements StoresService {

    private final APIProperties apiProperties;
    private final WebClient dataPortalSemasWebClient;
    private final RegionCodeRepository regionCodeRepository;
    private final AdministrativeBoundaryRepository boundaryRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    // 응답 캐시 (signguCd:semasKsicCode 기준)
    private static final Map<String, StoreMapResponseDto> responseCache = new ConcurrentHashMap<>();

    @Override
    @Transactional(readOnly = true)
    public StoreMapResponseDto getStoreList(String signguCd, String semasKsicCode) {
        String cacheKey = signguCd + ":" + semasKsicCode;
        if (responseCache.containsKey(cacheKey)) {
            return responseCache.get(cacheKey);
        }

        try {
            // 1. DB에서 시군구 정보 조회 (중심 좌표용)
            RegionCode sigungu = regionCodeRepository.findByRegionCode(Integer.parseInt(signguCd)).orElse(null);
            double sigLat = (sigungu != null && sigungu.getLatitude() != null) ? sigungu.getLatitude() : 37.5665;
            double sigLng = (sigungu != null && sigungu.getLongitude() != null) ? sigungu.getLongitude() : 126.978;

            // 2. DB에서 해당 시군구의 행정동 경계 데이터 조회 (adm_cd가 signguCd로 시작하는 것)
            List<AdministrativeBoundaries> dbBoundaries = boundaryRepository.findByAdmCdStartingWith(signguCd);
            log.info("DB에서 조회된 행정동 경계 수: {} (signguCd={})", dbBoundaries.size(), signguCd);

            // 3. SEMAS API 호출 — 업종별 업소 데이터
            SemasAPIDto response = dataPortalSemasWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("")
                            .queryParam("serviceKey", apiProperties.getDataPortal().getKey())
                            .queryParam("pageNo", 1)
                            .queryParam("numOfRows", 1000)
                            .queryParam("divId", "signguCd")
                            .queryParam("key", signguCd)
                            .queryParam("indsSclsCd", semasKsicCode)
                            .queryParam("type", "json")
                            .build())
                    .retrieve()
                    .bodyToMono(SemasAPIDto.class)
                    .block();

            // 4. SEMAS API 결과가 없을 경우 — 빈 응답 (경계 데이터는 포함)
            if (response == null || response.getBody() == null || response.getBody().getItems() == null) {
                List<StoreByRegionDto> emptyRegions = buildRegionList(dbBoundaries, Collections.emptyMap());
                return StoreMapResponseDto.builder()
                        .totalCount(0)
                        .storeByRegionDtoList(emptyRegions)
                        .centerLat(sigLat)
                        .centerLng(sigLng)
                        .build();
            }

            List<SemasItemDto> items = response.getBody().getItems();

            // 5. 행정동명 기준으로 업소수 집계
            Map<String, Integer> adongNmCountMap = items.stream()
                    .collect(Collectors.groupingBy(
                            item -> item.getAdongNm() != null ? item.getAdongNm() : "",
                            Collectors.summingInt(item -> 1)));
            log.info("adongNmCountMap 샘플: {}", adongNmCountMap.entrySet().stream()
                    .limit(5).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)));

            // 6. DB 경계 데이터와 업소수 매핑
            List<StoreByRegionDto> regions = buildRegionList(dbBoundaries, adongNmCountMap);
            log.info("전체 지역 수: {}, 업소 있는 지역 수: {}",
                    regions.size(),
                    regions.stream().filter(r -> r.getCount() > 0).count());

            StoreByRegionDto mostRegion = regions.stream()
                    .max(Comparator.comparingInt(StoreByRegionDto::getCount))
                    .orElse(null);
            StoreByRegionDto leastRegion = regions.stream()
                    .min(Comparator.comparingInt(StoreByRegionDto::getCount))
                    .orElse(null);

            StoreMapResponseDto result = StoreMapResponseDto.builder()
                    .totalCount(items.size())
                    .mostRegion(mostRegion)
                    .leastRegion(leastRegion)
                    .storeByRegionDtoList(regions)
                    .centerLat(sigLat)
                    .centerLng(sigLng)
                    .build();

            responseCache.put(cacheKey, result);
            return result;

        } catch (Exception e) {
            log.error("getStoreList 처리 중 오류 발생 — signguCd: {}, ksicCode: {}", signguCd, semasKsicCode, e);
            throw new RuntimeException("상권 지도 데이터 조회 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * DB 경계 데이터 목록과 업소수 Map을 조합하여 StoreByRegionDto 리스트 생성
     */
    private List<StoreByRegionDto> buildRegionList(
            List<AdministrativeBoundaries> boundaries,
            Map<String, Integer> adongNmCountMap) {

        return boundaries.stream()
                .map(b -> {
                    String admNm = b.getAdmNm();
                    int count = adongNmCountMap.getOrDefault(admNm, 0);

                    // 정규화 매칭 (특수문자·공백 무시)
                    if (count == 0) {
                        final String normNm = normalize(admNm);
                        count = adongNmCountMap.entrySet().stream()
                                .filter(e -> normalize(e.getKey()).equals(normNm))
                                .mapToInt(Map.Entry::getValue)
                                .sum();
                    }

                    // boundary JSON 문자열을 JsonNode로 파싱
                    JsonNode geometryNode = null;
                    try {
                        geometryNode = mapper.readTree(b.getBoundary());
                    } catch (Exception ex) {
                        log.warn("boundary JSON 파싱 실패 — admCd={}: {}", b.getAdmCd(), ex.getMessage());
                    }

                    return StoreByRegionDto.builder()
                            .adongCd(b.getAdmCd())
                            .adongNm(admNm)
                            .count(count)
                            .geometry(geometryNode)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private String normalize(String nm) {
        if (nm == null) return "";
        return nm.replaceAll("[·.·,\\s]+", "");
    }
}