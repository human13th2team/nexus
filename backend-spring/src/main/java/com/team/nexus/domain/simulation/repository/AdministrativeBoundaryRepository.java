package com.team.nexus.domain.simulation.repository;

import com.team.nexus.global.entity.AdministrativeBoundaries;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AdministrativeBoundaryRepository extends JpaRepository<AdministrativeBoundaries, UUID> {

    // 행정동 코드 앞 5자리(시군구 코드)로 해당 시군구의 모든 행정동 경계 조회
    List<AdministrativeBoundaries> findByAdmCdStartingWith(String admCdPrefix);
}
