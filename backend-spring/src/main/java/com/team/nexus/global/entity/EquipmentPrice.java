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
    @JoinColumn(name = "category_id", nullable = false)
    private IndustryCategory industryCategory;

    @Column(name = "item_name", nullable = false, length = 100)
    private String itemName;

    @Column(name = "standard_price")
    private Integer standardPrice;

    @Column(name = "unit", length = 20)
    private String unit;
}
