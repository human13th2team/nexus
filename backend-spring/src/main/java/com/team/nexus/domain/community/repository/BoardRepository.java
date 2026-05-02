package com.team.nexus.domain.community.repository;

import com.team.nexus.global.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BoardRepository extends JpaRepository<Board, UUID> {
    List<Board> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
}
