package com.team.nexus.domain.simulation.service;

import com.team.nexus.domain.simulation.dto.ProcessedRealEstateDto;
import com.team.nexus.domain.simulation.dto.RealEstateAPIResponseDto;
import com.team.nexus.domain.simulation.dto.RealEstateResponseItemDto;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;

@Service
@RequiredArgsConstructor
public class RealEstateServiceImpl implements RealEstateService {
    private final APIProperties apiProperties;
    private final WebClient dataPortalRealEstateWebClient;
    private static final XmlMapper XML_MAPPER = new XmlMapper();

    private static final int TARGET_COUNT = 5;

    @Override
    @Transactional
    public List<ProcessedRealEstateDto> getProcessedRealEstateList(Integer regionCode) {
        List<ProcessedRealEstateDto> under100M = new ArrayList<>();
        List<ProcessedRealEstateDto> over100M = new ArrayList<>();
        LocalDate searchDate = LocalDate.now();

        for (int i = 0; i < 12; i++) {
            String dealYMD = searchDate.minusMonths(i).format(DateTimeFormatter.ofPattern("yyyyMM"));
            int pageNo = 1;
            boolean hasNextPage = true;

            while (hasNextPage) {
                RealEstateAPIResponseDto response = fetchApi(regionCode, dealYMD, pageNo);

                if (response == null || response.getResponse() == null || response.getResponse().getBody() == null) {
                    break;
                }

                var body = response.getResponse().getBody();
                var items = body.getItems() != null ? body.getItems().getItem() : null;

                if (items != null) {
                    for (var item : items) {
                        ProcessedRealEstateDto processed = mapAndCalculate(item);

                        if (Boolean.TRUE.equals(processed.getIsWithin100M())) {
                            if (under100M.size() < TARGET_COUNT)
                                under100M.add(processed);
                        } else {
                            if (over100M.size() < TARGET_COUNT)
                                over100M.add(processed);
                        }

                        if (under100M.size() >= TARGET_COUNT && over100M.size() >= TARGET_COUNT) {
                            return combine(under100M, over100M);
                        }
                    }
                }

                if (pageNo * body.getNumOfRows() < body.getTotalCount()) {
                    pageNo++;
                } else {
                    hasNextPage = false;
                }
            }
        }
        return combine(under100M, over100M);
    }

    private RealEstateAPIResponseDto fetchApi(Integer regionCode, String dealYMD, int pageNo) {
        try {
            String xmlResponse = dataPortalRealEstateWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("serviceKey", apiProperties.getDataPortal().getKey())
                            .queryParam("LAWD_CD", regionCode)
                            .queryParam("DEAL_YMD", dealYMD)
                            .queryParam("pageNo", pageNo)
                            .queryParam("numOfRows", 20)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return XML_MAPPER.readValue(xmlResponse, RealEstateAPIResponseDto.class);
        } catch (Exception e) {
            System.err.println("Error fetching real estate data: " + e.getMessage());
            return null;
        }
    }

    private ProcessedRealEstateDto mapAndCalculate(RealEstateResponseItemDto raw) {
        ProcessedRealEstateDto dto = new ProcessedRealEstateDto();

        dto.setBuildingAr(raw.buildingAr);
        dto.setLandUse(raw.landUse);
        dto.setBuildingType(raw.buildingType);
        dto.setBuildingUse(raw.buildingUse);
        dto.setFloor(raw.floor);
        dto.setDealAmount(raw.dealAmount);

        if (raw.sggNm != null && raw.umdNm != null) {
            dto.setAddress(raw.sggNm.trim() + " " + raw.umdNm.trim());
        }

        if (raw.dealYear != null && raw.dealMonth != null && raw.dealDay != null) {
            dto.setDealDate(String.format("%s-%02d-%02d",
                    raw.dealYear.trim(),
                    Integer.parseInt(raw.dealMonth.trim()),
                    Integer.parseInt(raw.dealDay.trim())));
        }

        if (raw.buildYear != null && !raw.buildYear.isBlank()) {
            dto.setBuildAge(LocalDate.now().getYear() - Integer.parseInt(raw.buildYear.trim()));
        }

        dto.setIsWithin100M(dto.getIsWithin100M());
        dto.setPricePerPyeong(dto.getPricePerPyeong());

        return dto;
    }

    private List<ProcessedRealEstateDto> combine(List<ProcessedRealEstateDto> a, List<ProcessedRealEstateDto> b) {
        List<ProcessedRealEstateDto> res = new ArrayList<>(a);
        res.addAll(b);
        return res;
    }
}