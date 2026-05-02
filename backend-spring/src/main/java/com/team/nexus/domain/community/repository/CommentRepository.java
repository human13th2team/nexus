package com.team.nexus.domain.community.repository;

import com.team.nexus.global.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
}
