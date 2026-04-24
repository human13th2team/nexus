package com.team.nexus.domain.board.service;

import com.team.nexus.domain.board.repository.BoardLikeRepository;
import com.team.nexus.domain.board.repository.BoardRepository;
import com.team.nexus.global.entity.Board;
import com.team.nexus.global.entity.BoardLike;
import com.team.nexus.global.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BoardLikeServiceImpl implements BoardLikeService {

    private final BoardLikeRepository boardLikeRepository;
    private final BoardRepository boardRepository;

    @Override
    @Transactional
    public boolean toggleLike(UUID boardId, User user) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        Optional<BoardLike> boardLike = boardLikeRepository.findByBoardAndUser(board, user);

        if (boardLike.isPresent()) {
            boardLikeRepository.delete(boardLike.get());
            board.setLikeCount(Math.max(0, (board.getLikeCount() == null ? 0 : board.getLikeCount()) - 1));
            return false;
        } else {
            BoardLike newLike = BoardLike.builder()
                    .board(board)
                    .user(user)
                    .build();
            boardLikeRepository.save(newLike);
            board.setLikeCount((board.getLikeCount() == null ? 0 : board.getLikeCount()) + 1);
            return true;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isLiked(UUID boardId, User user) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        return boardLikeRepository.existsByBoardAndUser(board, user);
    }
}
