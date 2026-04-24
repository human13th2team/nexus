package com.team.nexus.domain.board.service;

import com.team.nexus.global.entity.User;
import java.util.UUID;

public interface BoardLikeService {
    boolean toggleLike(UUID boardId, User user);
    boolean isLiked(UUID boardId, User user);
}
