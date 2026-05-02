package com.team.nexus.domain.admin.service;

import com.team.nexus.domain.admin.dto.AdminDashboardDto;
import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.domain.community.repository.BoardRepository;
import com.team.nexus.domain.community.repository.CommentRepository;
import com.team.nexus.domain.grouppurchase.repository.GroupPurchaseRepository;
import com.team.nexus.domain.chat.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;
    private final CommentRepository commentRepository;
    private final GroupPurchaseRepository groupPurchaseRepository;
    private final ChatRoomRepository chatRoomRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardDto getDashboardData() {
        return AdminDashboardDto.builder()
                .users(userRepository.findAll().stream()
                        .map(u -> AdminDashboardDto.UserSummaryDto.builder()
                                .id(u.getId().toString())
                                .email(u.getEmail())
                                .nickname(u.getNickname())
                                .userType(u.getUserType())
                                .loginType(u.getLoginType())
                                .bizNo(u.getBizNo())
                                .createdAt(u.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()))
                .boards(boardRepository.findAll().stream()
                        .map(b -> AdminDashboardDto.BoardSummaryDto.builder()
                                .id(b.getId().toString())
                                .title(b.getTitle())
                                .authorNickname(b.getUser().getNickname())
                                .createdAt(b.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()))
                .comments(commentRepository.findAll().stream()
                        .map(c -> AdminDashboardDto.CommentSummaryDto.builder()
                                .id(c.getId().toString())
                                .content(c.getContent())
                                .authorNickname(c.getUser().getNickname())
                                .boardTitle(c.getBoard().getTitle())
                                .createdAt(c.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()))
                .purchases(groupPurchaseRepository.findAll().stream()
                        .map(p -> AdminDashboardDto.PurchaseSummaryDto.builder()
                                .id(p.getId().toString())
                                .title(p.getTitle())
                                .status(p.getStatus())
                                .currentCount(p.getCurrentParticipants())
                                .createdAt(p.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()))
                .chatRooms(chatRoomRepository.findAll().stream()
                        .map(cr -> AdminDashboardDto.ChatRoomSummaryDto.builder()
                                .id(cr.getId().toString())
                                .name(cr.getName())
                                .creatorNickname(cr.getCreator().getNickname())
                                .currentUserCount(cr.getCurrentUserCount())
                                .createdAt(cr.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
