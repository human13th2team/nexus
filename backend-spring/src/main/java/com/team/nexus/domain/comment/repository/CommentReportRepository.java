package com.team.nexus.domain.comment.repository;

import com.team.nexus.global.entity.Comment;
import com.team.nexus.global.entity.CommentReport;
import com.team.nexus.global.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CommentReportRepository extends JpaRepository<CommentReport, UUID> {
    boolean existsByCommentAndUser(Comment comment, User user);
}
