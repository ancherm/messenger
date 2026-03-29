package ru.redcode.poster.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.redcode.poster.server.dto.ChatCreateRequest;
import ru.redcode.poster.server.dto.ChatParticipantResponse;
import ru.redcode.poster.server.dto.ChatResponse;
import ru.redcode.poster.server.dto.ChatUpdateRequest;
import ru.redcode.poster.server.dto.ChatWithParticipantsResponse;
import ru.redcode.poster.server.exceptions.BadRequestException;
import ru.redcode.poster.server.exceptions.ChatNotFoundException;
import ru.redcode.poster.server.exceptions.ForbiddenOperationException;
import ru.redcode.poster.server.model.Chat;
import ru.redcode.poster.server.model.ChatParticipant;
import ru.redcode.poster.server.model.User;
import ru.redcode.poster.server.model.enums.ChatType;
import ru.redcode.poster.server.model.enums.ParticipantRole;
import ru.redcode.poster.server.repository.ChatParticipantRepository;
import ru.redcode.poster.server.repository.ChatRepository;
import ru.redcode.poster.server.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ChatResponse> listMyChats(Long currentUserId) {
        return chatParticipantRepository.findActiveChatsForUserOrderByUpdated(currentUserId).stream()
                .map(this::toChatResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatResponse createChat(Long currentUserId, ChatCreateRequest req) {
        ChatType type = req.getType();
        return switch (type) {
            case PRIVATE -> createPrivateChat(currentUserId, req);
            case GROUP, CHANNEL -> createGroupOrChannel(currentUserId, req);
        };
    }

    private ChatResponse createPrivateChat(Long currentUserId, ChatCreateRequest req) {
        Long peerId = req.getPeerUserId();
        if (peerId == null) {
            throw new BadRequestException("peerUserId is required for PRIVATE chat");
        }
        if (peerId.equals(currentUserId)) {
            throw new BadRequestException("peerUserId must differ from current user");
        }
        userRepository.findById(peerId).orElseThrow(() -> new BadRequestException("Peer user not found"));

        return chatParticipantRepository
                .findPrivateChatBetweenUsers(currentUserId, peerId, ChatType.PRIVATE)
                .map(this::toChatResponse)
                .orElseGet(() -> buildNewPrivateChat(currentUserId, peerId, req));
    }

    private ChatResponse buildNewPrivateChat(Long currentUserId, Long peerId, ChatCreateRequest req) {
        User current = userRepository.findById(currentUserId).orElseThrow();
        User peer = userRepository.findById(peerId).orElseThrow();

        String title = req.getTitle();
        if (title == null || title.isBlank()) {
            title = privateChatTitle(current, peer);
        }

        Chat chat = new Chat();
        chat.setType(ChatType.PRIVATE);
        chat.setTitle(title.trim());
        chat.setDescription(req.getDescription());
        chat.setAvatarUrl(req.getAvatarUrl());
        chat.setCreatedById(currentUserId);
        LocalDateTime now = LocalDateTime.now();
        chat.setCreatedAt(now);
        chat.setUpdatedAt(now);
        chatRepository.save(chat);

        addParticipant(chat, current, ParticipantRole.OWNER);
        addParticipant(chat, peer, ParticipantRole.MEMBER);
        return toChatResponse(chat);
    }

    private static String privateChatTitle(User a, User b) {
        String left = a.getUsername();
        String right = b.getUsername();
        return left + ", " + right;
    }

    private ChatResponse createGroupOrChannel(Long currentUserId, ChatCreateRequest req) {
        String title = req.getTitle();
        if (title == null || title.isBlank()) {
            throw new BadRequestException("title is required for GROUP and CHANNEL");
        }

        Chat chat = new Chat();
        chat.setType(req.getType());
        chat.setTitle(title.trim());
        chat.setDescription(req.getDescription());
        chat.setAvatarUrl(req.getAvatarUrl());
        chat.setCreatedById(currentUserId);
        LocalDateTime now = LocalDateTime.now();
        chat.setCreatedAt(now);
        chat.setUpdatedAt(now);
        chatRepository.save(chat);

        User creator = userRepository.findById(currentUserId).orElseThrow();
        addParticipant(chat, creator, ParticipantRole.OWNER);

        if (req.getParticipantIds() != null) {
            Set<Long> ids = new LinkedHashSet<>(req.getParticipantIds());
            ids.remove(currentUserId);
            for (Long uid : ids) {
                User u = userRepository.findById(uid)
                        .orElseThrow(() -> new BadRequestException("User not found: " + uid));
                addParticipant(chat, u, ParticipantRole.MEMBER);
            }
        }

        return toChatResponse(chat);
    }

    private ChatParticipant addParticipant(Chat chat, User user, ParticipantRole role) {
        ChatParticipant cp = new ChatParticipant();
        cp.setChat(chat);
        cp.setUser(user);
        cp.setRole(role);
        cp.setJoinedAt(LocalDateTime.now());
        cp.setLeftAt(null);
        cp.setAdmin(role == ParticipantRole.ADMIN || role == ParticipantRole.OWNER);
        return chatParticipantRepository.save(cp);
    }

    @Transactional(readOnly = true)
    public Page<ChatResponse> searchChats(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        String q = query.trim();
        return chatRepository
                .searchGroupsAndChannelsByTitle(ChatType.GROUP, ChatType.CHANNEL, q, pageable)
                .map(this::toChatResponse);
    }

    @Transactional(readOnly = true)
    public ChatWithParticipantsResponse getChatWithParticipants(Long chatId, Long currentUserId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatNotFoundException("Chat not found"));
        ensureActiveMember(chatId, currentUserId);

        List<ChatParticipantResponse> parts = chatParticipantRepository.findByChatIdWithUserOrdered(chatId).stream()
                .filter(participant -> participant.getLeftAt() == null)
                .map(this::toParticipantResponse)
                .collect(Collectors.toList());

        return new ChatWithParticipantsResponse(toChatResponse(chat), parts);
    }

    @Transactional
    public ChatResponse updateChat(Long chatId, Long currentUserId, ChatUpdateRequest req) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatNotFoundException("Chat not found"));
        ChatParticipant me = chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, currentUserId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));
        if (me.getRole() != ParticipantRole.OWNER && me.getRole() != ParticipantRole.ADMIN) {
            throw new ForbiddenOperationException("Only OWNER or ADMIN can update the chat");
        }

        if (req.getTitle() != null) {
            chat.setTitle(req.getTitle());
        }
        if (req.getDescription() != null) {
            chat.setDescription(req.getDescription());
        }
        if (req.getAvatarUrl() != null) {
            chat.setAvatarUrl(req.getAvatarUrl());
        }
        chat.setUpdatedAt(LocalDateTime.now());
        chatRepository.save(chat);
        return toChatResponse(chat);
    }

    @Transactional
    public void deleteOrLeaveChat(Long chatId, Long currentUserId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatNotFoundException("Chat not found"));
        ChatParticipant me = chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, currentUserId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));

        if (me.getRole() == ParticipantRole.OWNER || me.getRole() == ParticipantRole.ADMIN) {
            chatRepository.delete(chat);
        } else {
            me.setLeftAt(LocalDateTime.now());
            chatParticipantRepository.save(me);
        }
    }

    public void ensureActiveMember(Long chatId, Long userId) {
        chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, userId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));
    }

    @Transactional
    public List<ChatParticipantResponse> addParticipants(Long chatId, Long currentUserId, List<Long> userIds) {
        ChatParticipant me = chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, currentUserId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));
        if (me.getRole() != ParticipantRole.OWNER && me.getRole() != ParticipantRole.ADMIN) {
            throw new ForbiddenOperationException("Only OWNER or ADMIN can add participants");
        }
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatNotFoundException("Chat not found"));
        if (chat.getType() == ChatType.PRIVATE) {
            throw new BadRequestException("Cannot add participants to a PRIVATE chat");
        }
        List<ChatParticipantResponse> result = new java.util.ArrayList<>();
        for (Long uid : userIds) {
            Optional<ChatParticipant> active = chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, uid);
            if (active.isPresent()) {
                result.add(toParticipantResponse(active.get()));
                continue;
            }
            Optional<ChatParticipant> inactive = chatParticipantRepository.findByChatIdAndUserId(chatId, uid);
            if (inactive.isPresent()) {
                ChatParticipant cp = inactive.get();
                cp.setLeftAt(null);
                cp.setJoinedAt(LocalDateTime.now());
                cp.setRole(ParticipantRole.MEMBER);
                cp.setAdmin(false);
                chatParticipantRepository.save(cp);
                result.add(toParticipantResponse(cp));
                continue;
            }
            User u = userRepository.findById(uid)
                    .orElseThrow(() -> new BadRequestException("User not found: " + uid));
            ChatParticipant cp = addParticipant(chat, u, ParticipantRole.MEMBER);
            result.add(toParticipantResponse(cp));
        }
        return result;
    }

    @Transactional
    public ChatParticipantResponse updateParticipantRole(Long chatId, Long currentUserId, Long targetUserId, ParticipantRole newRole) {
        ChatParticipant me = chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, currentUserId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));
        if (me.getRole() != ParticipantRole.OWNER) {
            throw new ForbiddenOperationException("Only OWNER can change participant roles");
        }
        if (targetUserId.equals(currentUserId)) {
            throw new BadRequestException("Cannot change your own role");
        }
        ChatParticipant target = chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, targetUserId)
                .orElseThrow(() -> new BadRequestException("Target user is not an active member"));
        target.setRole(newRole);
        target.setAdmin(newRole == ParticipantRole.ADMIN || newRole == ParticipantRole.OWNER);
        chatParticipantRepository.save(target);
        return toParticipantResponse(target);
    }

    @Transactional
    public void removeParticipant(Long chatId, Long currentUserId, Long targetUserId) {
        chatRepository.findById(chatId).orElseThrow(() -> new ChatNotFoundException("Chat not found"));
        ChatParticipant me = chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, currentUserId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));
        if (me.getRole() != ParticipantRole.OWNER && me.getRole() != ParticipantRole.ADMIN) {
            throw new ForbiddenOperationException("Only OWNER or ADMIN can remove participants");
        }
        ChatParticipant target = chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, targetUserId)
                .orElseThrow(() -> new BadRequestException("Target user is not an active member"));
        if (target.getRole() == ParticipantRole.OWNER) {
            throw new ForbiddenOperationException("Cannot remove the OWNER");
        }
        target.setLeftAt(LocalDateTime.now());
        chatParticipantRepository.save(target);
    }

    private ChatResponse toChatResponse(Chat chat) {
        return new ChatResponse(
                chat.getId(),
                chat.getType(),
                chat.getTitle(),
                chat.getDescription(),
                chat.getAvatarUrl(),
                chat.getCreatedById(),
                chat.getCreatedAt(),
                chat.getUpdatedAt()
        );
    }

    private ChatParticipantResponse toParticipantResponse(ChatParticipant cp) {
        return new ChatParticipantResponse(
                cp.getUser().getId(),
                cp.getUser().getUsername(),
                cp.getRole(),
                cp.getJoinedAt(),
                cp.getLeftAt()
        );
    }
}
