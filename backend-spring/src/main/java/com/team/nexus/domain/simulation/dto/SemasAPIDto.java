package com.team.nexus.domain.simulation.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SemasAPIDto {
    private Body body;

    @Getter
    @Setter
    public static class Body {
        private Integer totalCount;
    }
}
