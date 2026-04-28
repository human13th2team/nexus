package com.team.nexus.domain.chat.service;

import com.team.nexus.domain.chat.dto.ChatMessageRequestDto;
import com.team.nexus.domain.chat.dto.ChatMessageResponseDto;
import com.team.nexus.global.entity.ChatRoom;

import java.util.List;
import java.util.UUID;

public interface ChatService {
    ChatRoom createRoom(String title, ChatRoom.ChatRoomType type, String description, UUID creatorId);
    void joinRoom(UUID roomId, UUID userId);
    ChatMessageResponseDto saveMessage(ChatMessageRequestDto messageDto);
    List<ChatMessageResponseDto> getMessages(UUID roomId);
    List<ChatRoom> getAllRooms();
    List<ChatRoom> getJoinedRooms(UUID userId);
}
