package com.team.nexus.domain.board.repository;

import com.team.nexus.global.entity.Board;
import com.team.nexus.global.entity.BoardLike;
import com.team.nexus.global.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardLikeRepository extends JpaRepository<BoardLike, UUID> {
    Optional<BoardLike> findByBoardAndUser(Board board, User user);
    boolean existsByBoardAndUser(Board board, User user);
}
