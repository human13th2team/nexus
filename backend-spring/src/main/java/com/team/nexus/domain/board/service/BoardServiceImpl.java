package com.team.nexus.domain.board.service;

import com.team.nexus.domain.board.dto.BoardCreateRequestDto;
import com.team.nexus.domain.board.dto.BoardResponseDto;
import com.team.nexus.domain.board.repository.BoardRepository;
import com.team.nexus.domain.comment.repository.CommentRepository;
import com.team.nexus.global.entity.Board;
import com.team.nexus.global.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardServiceImpl implements BoardService {
    private final BoardRepository boardRepository;
    private final CommentRepository commentRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDto> getBoardList(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Board> boards = boardRepository.findAllByOrderByCreatedAtDesc(pageable);
        
        return boards.map(board -> BoardResponseDto.builder()
                .id(board.getId())
                .title(board.getTitle())
                .author(board.getIsAnonymous() ? "익명" : board.getUser().getNickname())
                .authorId(board.getUser().getId())
                .imageUrl(board.getImageUrl())
                .createdAt(board.getCreatedAt())
                .viewCount(board.getViewCount() == null ? 0 : board.getViewCount())
                .likeCount(board.getLikeCount() == null ? 0 : board.getLikeCount())
                .commentCount(commentRepository.countByBoardId(board.getId()))
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BoardResponseDto> getTopPosts() {
        return boardRepository.findTop3ByOrderByViewCountDesc().stream()
                .map(board -> BoardResponseDto.builder()
                        .id(board.getId())
                        .title(board.getTitle())
                        .authorId(board.getUser().getId())
                        .viewCount(board.getViewCount() == null ? 0 : board.getViewCount())
                        .likeCount(board.getLikeCount() == null ? 0 : board.getLikeCount())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BoardResponseDto getPostDetail(UUID id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        // 조회수 증가
        board.setViewCount((board.getViewCount() == null ? 0 : board.getViewCount()) + 1);
        
        return BoardResponseDto.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .imageUrl(board.getImageUrl())
                .author(board.getIsAnonymous() ? "익명" : board.getUser().getNickname())
                .authorId(board.getUser().getId())
                .createdAt(board.getCreatedAt())
                .viewCount(board.getViewCount())
                .likeCount(board.getLikeCount() == null ? 0 : board.getLikeCount())
                .commentCount(commentRepository.countByBoardId(board.getId()))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDto> getPopularPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Board> boards = boardRepository.findAllByLikeCountGreaterThanEqualOrderByCreatedAtDesc(10, pageable);
        
        return boards.map(board -> BoardResponseDto.builder()
                .id(board.getId())
                .title(board.getTitle())
                .author(board.getIsAnonymous() ? "익명" : board.getUser().getNickname())
                .authorId(board.getUser().getId())
                .imageUrl(board.getImageUrl())
                .createdAt(board.getCreatedAt())
                .viewCount(board.getViewCount() == null ? 0 : board.getViewCount())
                .likeCount(board.getLikeCount() == null ? 0 : board.getLikeCount())
                .commentCount(commentRepository.countByBoardId(board.getId()))
                .build());
    }

    @Override
    @Transactional
    public void createPost(BoardCreateRequestDto requestDto, User user) {
        Board board = Board.builder()
                .title(requestDto.getTitle())
                .content(requestDto.getContent())
                .regionName(requestDto.getRegionName())
                .categoryName(requestDto.getCategoryName())
                .isAnonymous(requestDto.getIsAnonymous() != null && requestDto.getIsAnonymous())
                .imageUrl(requestDto.getImageUrl())
                .viewCount(0)
                .user(user)
                .build();
        
        boardRepository.save(board);
    }

    @Override
    @Transactional
    public void deletePost(UUID id, User user) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        
        if (!board.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("본인의 게시글만 삭제할 수 있습니다.");
        }
        
        boardRepository.delete(board);
    }
}
