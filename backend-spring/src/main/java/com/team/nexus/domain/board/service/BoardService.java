package com.team.nexus.domain.board.service;

import com.team.nexus.domain.board.dto.BoardCreateRequestDto;
import com.team.nexus.domain.board.dto.BoardResponseDto;
import com.team.nexus.global.entity.User;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface BoardService {
    Page<BoardResponseDto> getBoardList(int page, int size);
    
    List<BoardResponseDto> getTopPosts();
    
    BoardResponseDto getPostDetail(UUID id);
    
    void createPost(BoardCreateRequestDto requestDto, User user);
}
