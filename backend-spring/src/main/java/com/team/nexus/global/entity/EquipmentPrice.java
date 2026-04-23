package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Table(name = "equipment_prices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentPrice {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "industry_category_id")
    private IndustryCategory industryCategory;

    @Column(name = "equipment_kr", nullable = false, length = 50)
    private String equipmentKr;

    @Column(name = "equipment_eng", nullable = false, length = 50)
    private String equipmentEng;

    @Column(name = "price")
    private Integer price;
}
