package com.team.nexus.domain.board.repository;

import com.team.nexus.global.entity.Board;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BoardRepository extends JpaRepository<Board, UUID> {
    Page<Board> findAllByOrderByCreatedAtDesc(Pageable pageable);
    java.util.List<Board> findTop3ByOrderByViewCountDesc();
    Page<Board> findAllByLikeCountGreaterThanEqualOrderByCreatedAtDesc(int likeCount, Pageable pageable);
    @org.springframework.data.jpa.repository.Query("SELECT b FROM Board b WHERE " +
            "LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(b.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "(b.isAnonymous = false AND LOWER(b.user.nickname) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Board> findByKeywordAll(@org.springframework.data.repository.query.Param("keyword") String keyword, Pageable pageable);

    Page<Board> findByTitleContainingOrderByCreatedAtDesc(String title, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT b FROM Board b WHERE " +
            "b.isAnonymous = false AND LOWER(b.user.nickname) LIKE LOWER(CONCAT('%', :nickname, '%'))")
    Page<Board> findByPublicUserNickname(@org.springframework.data.repository.query.Param("nickname") String nickname, Pageable pageable);

    Page<Board> findByIsAnonymousTrueOrderByCreatedAtDesc(Pageable pageable);
}
