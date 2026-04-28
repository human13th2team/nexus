package com.team.nexus.domain.chat.service;

import com.team.nexus.domain.chat.dto.ChatMessageRequestDto;
import com.team.nexus.domain.chat.dto.ChatMessageResponseDto;
import com.team.nexus.domain.chat.dto.ChatRoomResponseDto;
import com.team.nexus.domain.chat.repository.ChatMessageRepository;
import com.team.nexus.domain.chat.repository.ChatParticipantRepository;
import com.team.nexus.domain.chat.repository.ChatRoomRepository;
import com.team.nexus.global.entity.ChatMessage;
import com.team.nexus.global.entity.ChatRoom;
import com.team.nexus.global.entity.ChatParticipant;
import com.team.nexus.global.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final com.team.nexus.domain.auth.repository.UserRepository userRepository;

    @Override
    @Transactional
    public ChatRoomResponseDto createRoom(String title, ChatRoom.ChatRoomType type, String description, String imageUrl, UUID creatorId) {
        log.info("Creating chat room: title={}, type={}, creatorId={}", title, type, creatorId);
        try {
            User creator = userRepository.findById(creatorId)
                    .orElseThrow(() -> new IllegalArgumentException("방 생성자를 찾을 수 없습니다."));

            ChatRoom chatRoom = ChatRoom.builder()
                    .title(title)
                    .type(type)
                    .description(description)
                    .imageUrl(imageUrl)
                    .creator(creator)
                    .build();
            ChatRoom savedRoom = chatRoomRepository.save(chatRoom);
            log.info("Chat room saved successfully: id={}", savedRoom.getId());

            try {
                joinRoom(savedRoom.getId(), creatorId);
                log.info("Creator joined the room as participant: userId={}", creatorId);
            } catch (Exception memberEx) {
                log.warn("Failed to join creator to room automatically: {}", memberEx.getMessage());
            }
            
            return convertToResponseDto(savedRoom);
        } catch (Exception e) {
            log.error("Failed to create chat room: ", e);
            throw e;
        }
    }

    @Override
    @Transactional
    public void joinRoom(UUID roomId, UUID userId) {
        if (!chatParticipantRepository.existsByRoomIdAndUserId(roomId, userId)) {
            ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                    .orElseThrow(() -> new IllegalArgumentException("방을 찾을 수 없습니다."));
            
            if (chatRoom.getType() == ChatRoom.ChatRoomType.PRIVATE) {
                long count = chatParticipantRepository.countByRoomId(roomId);
                if (count >= 2) {
                    throw new IllegalStateException("1:1 채팅방은 정원이 가득 찼습니다.");
                }
            }

            ChatParticipant participant = ChatParticipant.builder()
                    .roomId(roomId)
                    .userId(userId)
                    .joinedAt(LocalDateTime.now())
                    .build();
            chatParticipantRepository.save(participant);
        }
    }

    @Override
    @Transactional
    public ChatMessageResponseDto saveMessage(ChatMessageRequestDto messageDto) {
        log.info("Saving message: senderId={}, roomId={}, type={}", messageDto.getSenderId(), messageDto.getRoomId(), messageDto.getType());
        try {
            log.info("Processing message save: senderId={}, roomId={}, type={}, fileUrl={}", 
                    messageDto.getSenderId(), messageDto.getRoomId(), messageDto.getType(), messageDto.getFileUrl());
            
            User user = userRepository.findById(messageDto.getSenderId())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. ID: " + messageDto.getSenderId()));

            // content가 null이면 제약 조건 위반이 발생하므로 기본값 설정
            String content = messageDto.getMessage();
            if (content == null || content.trim().isEmpty()) {
                if (messageDto.getType() == ChatMessage.MessageType.IMAGE) content = "사진을 보냈습니다.";
                else if (messageDto.getType() == ChatMessage.MessageType.FILE) content = "파일을 보냈습니다.";
                else content = "(내용 없음)";
            }

            ChatMessage chatMessage = ChatMessage.builder()
                    .roomId(messageDto.getRoomId())
                    .userId(messageDto.getSenderId())
                    .senderNickname(user.getNickname())
                    .content(content)
                    .type(messageDto.getType())
                    .fileUrl(messageDto.getFileUrl())
                    .fileName(messageDto.getFileName())
                    .build();
            
            ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
            log.info("Successfully saved message to DB. ID: {}", savedMessage.getId());

            // 채팅방의 마지막 메시지 시각 업데이트
            ChatRoom room = chatRoomRepository.findById(messageDto.getRoomId())
                    .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
            room.setLastMessageAt(LocalDateTime.now());
            chatRoomRepository.save(room);

            return ChatMessageResponseDto.builder()
                    .roomId(savedMessage.getRoomId())
                    .senderId(savedMessage.getUserId())
                    .senderNickname(savedMessage.getSenderNickname())
                    .message(savedMessage.getContent())
                    .type(savedMessage.getType())
                    .fileUrl(savedMessage.getFileUrl())
                    .fileName(savedMessage.getFileName())
                    .createdAt(LocalDateTime.now())
                    .build();
        } catch (Exception e) {
            log.error("Failed to save chat message. RequestDto: {}", messageDto);
            log.error("Error details: ", e);
            throw new RuntimeException("메시지 저장 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Override
    public List<ChatMessageResponseDto> getMessages(UUID roomId) {
        log.info("Fetching messages for room: {}", roomId);
        try {
            return chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId)
                    .stream()
                    .map(msg -> ChatMessageResponseDto.builder()
                            .roomId(roomId)
                            .senderId(msg.getUserId())
                            .senderNickname(msg.getSenderNickname() != null ? msg.getSenderNickname() : "익명")
                            .message(msg.getContent())
                            .type(msg.getType())
                            .fileUrl(msg.getFileUrl())
                            .fileName(msg.getFileName())
                            .createdAt(msg.getCreatedAt() != null ? msg.getCreatedAt() : LocalDateTime.now())
                            .build())
                    .toList();
        } catch (Exception e) {
            log.error("Failed to fetch messages for room: " + roomId, e);
            return List.of();
        }
    }

    @Override
    public List<ChatRoomResponseDto> getAllRooms() {
        return chatRoomRepository.findAll().stream()
                .filter(room -> {
                    if (room.getType() == ChatRoom.ChatRoomType.PRIVATE) {
                        return chatParticipantRepository.countByRoomId(room.getId()) < 2;
                    }
                    return true;
                })
                .sorted((r1, r2) -> {
                    LocalDateTime t1 = r1.getLastMessageAt() != null ? r1.getLastMessageAt() : r1.getCreatedAt();
                    LocalDateTime t2 = r2.getLastMessageAt() != null ? r2.getLastMessageAt() : r2.getCreatedAt();
                    return t2.compareTo(t1);
                })
                .map(this::convertToResponseDto)
                .toList();
    }

    @Override
    @Transactional
    public void leaveRoom(UUID roomId, UUID userId) {
        log.info("Leaving chat room: roomId={}, userId={}", roomId, userId);
        chatParticipantRepository.deleteByRoomIdAndUserId(roomId, userId);
    }

    @Override
    public List<ChatRoomResponseDto> getJoinedRooms(UUID userId) {
        List<UUID> roomIds = chatParticipantRepository.findByUserId(userId)
                .stream()
                .map(ChatParticipant::getRoomId)
                .toList();
        return chatRoomRepository.findAllById(roomIds).stream()
                .sorted((r1, r2) -> {
                    LocalDateTime t1 = r1.getLastMessageAt() != null ? r1.getLastMessageAt() : r1.getCreatedAt();
                    LocalDateTime t2 = r2.getLastMessageAt() != null ? r2.getLastMessageAt() : r2.getCreatedAt();
                    return t2.compareTo(t1);
                })
                .map(this::convertToResponseDto)
                .toList();
    }

    private ChatRoomResponseDto convertToResponseDto(ChatRoom chatRoom) {
        String lastMessage = chatMessageRepository.findFirstByRoomIdOrderByCreatedAtDesc(chatRoom.getId())
                .map(msg -> msg.getType() == ChatMessage.MessageType.IMAGE ? "(사진)" : 
                            msg.getType() == ChatMessage.MessageType.FILE ? "(파일)" : msg.getContent())
                .orElse(null);

        Long participantCount = chatParticipantRepository.countByRoomId(chatRoom.getId());

        return ChatRoomResponseDto.builder()
                .id(chatRoom.getId())
                .title(chatRoom.getTitle())
                .description(chatRoom.getDescription())
                .imageUrl(chatRoom.getImageUrl())
                .type(chatRoom.getType())
                .creatorId(chatRoom.getCreator() != null ? chatRoom.getCreator().getId() : null)
                .creatorNickname(chatRoom.getCreator() != null ? chatRoom.getCreator().getNickname() : "익명")
                .lastMessage(lastMessage)
                .lastMessageAt(chatRoom.getLastMessageAt() != null ? chatRoom.getLastMessageAt() : chatRoom.getCreatedAt())
                .createdAt(chatRoom.getCreatedAt())
                .participantCount(participantCount)
                .build();
    }
}
