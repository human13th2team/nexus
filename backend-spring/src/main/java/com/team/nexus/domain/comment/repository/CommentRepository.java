package com.team.nexus.domain.comment.repository;

import com.team.nexus.global.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    long countByBoardId(UUID boardId);
    List<Comment> findByBoardIdAndParentIsNullOrderByCreatedAtAsc(UUID boardId);
<<<<<<< HEAD
=======
    List<Comment> findByUserIdOrderByCreatedAtDesc(UUID userId);
>>>>>>> ee31a0495004b2bac36f517b8c0a8eacfec7f3a1
}
