package com.team.nexus.domain.simulation.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RealEstateAPIResponseDto {
    private Response response;

    @Getter
    @Setter
    public static class Response {
        private Body body;
    }

    @Getter
    @Setter
    public static class Body {
        private Items items;
        private int totalCount;
        private int pageNo;
        private int numOfRows;
    }

    @Getter
    @Setter
    public static class Items {
        private List<RealEstateResponseItemDto> item;
    }
}
