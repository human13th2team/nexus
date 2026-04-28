package com.team.nexus.domain.chat.repository;

import com.team.nexus.global.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByRoomIdOrderByCreatedAtAsc(UUID roomId);
    java.util.Optional<ChatMessage> findFirstByRoomIdOrderByCreatedAtDesc(UUID roomId);
}
