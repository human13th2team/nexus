package com.team.nexus.domain.simulation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.nexus.domain.simulation.dto.SemasAPIDto;
import com.team.nexus.domain.simulation.dto.SemasItemDto;
import com.team.nexus.domain.simulation.dto.StoreByRegionDto;
import com.team.nexus.domain.simulation.dto.StoreMapResponseDto;
import com.team.nexus.domain.simulation.repository.RegionCodeRepository;
import com.team.nexus.global.entity.RegionCode;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.io.InputStream;
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
    private final ObjectMapper mapper = new ObjectMapper();

    private static final Map<String, List<JsonNode>> sigunguBoundariesCache = new ConcurrentHashMap<>();

    private static final Map<String, StoreMapResponseDto> responseCache = new ConcurrentHashMap<>();

    private static final Map<String, String> countyNameToAdmPrefixCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        log.info("Starting to load hangjeongdong.json into memory...");
        try {
            ClassPathResource resource = new ClassPathResource("hangjeongdong.json");
            try (InputStream is = resource.getInputStream()) {
                JsonNode root = mapper.readTree(is);
                JsonNode features = root.path("features");

                int count = 0;
                for (JsonNode feature : features) {
                    String admCd = feature.path("properties").path("ADM_CD").asText();
                    if (admCd.length() >= 5) {
                        String sigunguCd = admCd.substring(0, 5);
                        sigunguBoundariesCache.computeIfAbsent(sigunguCd, k -> new ArrayList<>()).add(feature);
                        count++;
                    }
                }
                log.info("Successfully loaded {} administrative dongs into memory cache. sigunguCodes: {}",
                        count, sigunguBoundariesCache.size());
            }
        } catch (IOException e) {
            log.error("Failed to load hangjeongdong.json during initialization", e);
        }
    }

    private String resolveAdmPrefix(String dbRegionCode, RegionCode regionCodeEntity) {
        if (regionCodeEntity == null)
            return dbRegionCode;

        String countyName = regionCodeEntity.getCountyName();
        if (countyName == null || countyName.isBlank())
            return dbRegionCode;

        if (countyNameToAdmPrefixCache.containsKey(countyName)) {
            return countyNameToAdmPrefixCache.get(countyName);
        }

        double dbLat = regionCodeEntity.getLatitude() != null ? regionCodeEntity.getLatitude() : 0.0;
        double dbLng = regionCodeEntity.getLongitude() != null ? regionCodeEntity.getLongitude() : 0.0;

        if (dbLat == 0.0 && dbLng == 0.0) {
            log.warn("No lat/lng for countyName={}, using dbRegionCode={} as fallback", countyName, dbRegionCode);
            return dbRegionCode;
        }

        String bestPrefix = null;
        double minDist = Double.MAX_VALUE;

        for (Map.Entry<String, List<JsonNode>> entry : sigunguBoundariesCache.entrySet()) {
            String admPrefix = entry.getKey();
            List<JsonNode> features = entry.getValue();
            if (features.isEmpty())
                continue;

            double sumLat = 0, sumLng = 0;
            int ptCount = 0;
            for (JsonNode feat : features) {
                JsonNode coords = feat.path("geometry").path("coordinates");
                JsonNode ring = coords.isArray() && coords.size() > 0 ? coords.get(0) : null;
                if (ring == null || !ring.isArray())
                    continue;
                for (JsonNode pt : ring) {
                    if (!pt.isArray() || pt.size() < 2)
                        continue;
                    double x = pt.get(0).asDouble();
                    double y = pt.get(1).asDouble();

                    if (x > 1000) {
                        double DEG = 111319.49;
                        double lat = 38.0 + (y - 600000.0) / DEG;
                        double lng = 127.0 + (x - 200000.0) / (DEG * Math.cos(lat * Math.PI / 180.0));
                        sumLat += lat;
                        sumLng += lng;
                        ptCount++;
                    }
                }
            }

            if (ptCount == 0)
                continue;
            double avgLat = sumLat / ptCount;
            double avgLng = sumLng / ptCount;

            double dist = Math.pow(avgLat - dbLat, 2) + Math.pow(avgLng - dbLng, 2);
            if (dist < minDist) {
                minDist = dist;
                bestPrefix = admPrefix;
            }
        }

        if (bestPrefix != null) {
            countyNameToAdmPrefixCache.put(countyName, bestPrefix);
            log.info("Resolved countyName={} (regionCode={}) -> admPrefix={} (dist={})",
                    countyName, dbRegionCode, bestPrefix, minDist);
            return bestPrefix;
        }

        log.warn("Could not resolve admPrefix for countyName={}, fallback to dbRegionCode={}", countyName,
                dbRegionCode);
        return dbRegionCode;
    }

    @Override
    @Transactional(readOnly = true)
    public StoreMapResponseDto getStoreList(String signguCd, String semasKsicCode) {
        String cacheKey = signguCd + ":" + semasKsicCode;
        if (responseCache.containsKey(cacheKey)) {
            return responseCache.get(cacheKey);
        }

        try {

            RegionCode sigungu = regionCodeRepository.findByRegionCode(Integer.parseInt(signguCd)).orElse(null);
            double sigLat = (sigungu != null && sigungu.getLatitude() != null) ? sigungu.getLatitude() : 37.5665;
            double sigLng = (sigungu != null && sigungu.getLongitude() != null) ? sigungu.getLongitude() : 126.978;

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

            if (response == null || response.getBody() == null || response.getBody().getItems() == null) {
                return StoreMapResponseDto.builder()
                        .totalCount(0)
                        .storeByRegionDtoList(Collections.emptyList())
                        .centerLat(sigLat)
                        .centerLng(sigLng)
                        .build();
            }

            List<SemasItemDto> items = response.getBody().getItems();

            Map<String, Integer> adongNmCountMap = items.stream()
                    .collect(Collectors.groupingBy(
                            item -> item.getAdongNm() != null ? item.getAdongNm() : "",
                            Collectors.summingInt(item -> 1)));
            log.info("adongNmCountMap sample: {}", adongNmCountMap.entrySet().stream()
                    .limit(5).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)));

            String resolvedAdmPrefix = resolveAdmPrefix(signguCd, sigungu);
            log.info("getStoreList: signguCd(DB/SEMAS)={} -> hangjeongdong admPrefix={} (countyName={})",
                    signguCd, resolvedAdmPrefix,
                    sigungu != null ? sigungu.getCountyName() : "null");

            List<JsonNode> boundaries = sigunguBoundariesCache.getOrDefault(resolvedAdmPrefix, Collections.emptyList());
            log.info("boundaries size for admPrefix={}: {}", resolvedAdmPrefix, boundaries.size());

            List<StoreByRegionDto> regions = boundaries.stream()
                    .map(feature -> {
                        String admCd = feature.path("properties").path("ADM_CD").asText();
                        String admNm = feature.path("properties").path("ADM_NM").asText();

                        int count = adongNmCountMap.getOrDefault(admNm, 0);
                        if (count == 0) {
                            final String admNmNorm = normalizeAdmNm(admNm);
                            count = adongNmCountMap.entrySet().stream()
                                    .filter(e -> normalizeAdmNm(e.getKey()).equals(admNmNorm))
                                    .mapToInt(Map.Entry::getValue)
                                    .sum();
                        }

                        return StoreByRegionDto.builder()
                                .adongCd(admCd)
                                .adongNm(admNm)
                                .count(count)
                                .geometry(feature.path("geometry"))
                                .build();
                    })
                    .toList();

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
            log.info("items size: {}", items.size());
            log.info("regions total: {}, regions with count>0: {}",
                    regions.size(),
                    regions.stream().filter(r -> r.getCount() > 0).count());
            return result;

        } catch (Exception e) {
            log.error("Error in getStoreList for signguCd: {}, ksicCode: {}", signguCd, semasKsicCode, e);
            throw new RuntimeException("Internal Server Error occurred while processing store list", e);
        }
    }

    private String normalizeAdmNm(String nm) {
        if (nm == null)
            return "";
        return nm.replaceAll("[·.·,\\s]+", "");
    }
}