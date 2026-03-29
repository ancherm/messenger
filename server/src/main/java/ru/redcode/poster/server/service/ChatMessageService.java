package ru.redcode.poster.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.redcode.poster.server.dto.ChatMessageInbound;
import ru.redcode.poster.server.dto.MessageDeletedEvent;
import ru.redcode.poster.server.dto.MessageResponse;
import ru.redcode.poster.server.exceptions.BadRequestException;
import ru.redcode.poster.server.exceptions.ChatNotFoundException;
import ru.redcode.poster.server.exceptions.ForbiddenOperationException;
import ru.redcode.poster.server.exceptions.MessageNotFoundException;
import ru.redcode.poster.server.model.Chat;
import ru.redcode.poster.server.model.ChatParticipant;
import ru.redcode.poster.server.model.Message;
import ru.redcode.poster.server.model.User;
import ru.redcode.poster.server.model.enums.MessageType;
import ru.redcode.poster.server.model.enums.ParticipantRole;
import ru.redcode.poster.server.repository.ChatParticipantRepository;
import ru.redcode.poster.server.repository.ChatRepository;
import ru.redcode.poster.server.repository.MessageRepository;
import ru.redcode.poster.server.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatRepository chatRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public MessageResponse sendMessage(Long chatId, Long senderId, ChatMessageInbound inbound) {
        chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, senderId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatNotFoundException("Chat not found"));
        User sender = userRepository.findById(senderId).orElseThrow();

        MessageType contentType = inbound.getContentType() != null ? inbound.getContentType() : MessageType.TEXT;
        if (contentType == MessageType.TEXT && (inbound.getContent() == null || inbound.getContent().isBlank())) {
            throw new BadRequestException("content is required for TEXT messages");
        }

        LocalDateTime now = LocalDateTime.now();
        Message message = new Message();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(inbound.getContent());
        message.setContentType(contentType);
        message.setAttachmentUrl(inbound.getAttachmentUrl());
        message.setAttachmentName(inbound.getAttachmentName());
        message.setReplyToMessageId(inbound.getReplyToMessageId());
        message.setCreatedAt(now);
        message.setUpdatedAt(now);
        messageRepository.save(message);

        MessageResponse response = toResponse(message, chatId, sender);
        messagingTemplate.convertAndSend("/topic/chats/" + chatId + "/messages", response);
        return response;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(Long chatId, Long userId, Long before, Long after, int limit, String search) {
        chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, userId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));
        if (!chatRepository.existsById(chatId)) {
            throw new ChatNotFoundException("Chat not found");
        }
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        String q = (search != null && !search.isBlank()) ? "%" + search.trim().toLowerCase() + "%" : null;
        return messageRepository.findMessages(chatId, before, after, q, PageRequest.of(0, safeLimit))
                .stream()
                .map(m -> toResponse(m, chatId, m.getSender()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MessageResponse getMessageById(Long messageId, Long userId) {
        Message message = messageRepository.findByIdWithSender(messageId)
                .orElseThrow(() -> new MessageNotFoundException("Message not found"));
        Long chatId = message.getChat().getId();
        chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, userId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));
        return toResponse(message, chatId, message.getSender());
    }

    @Transactional
    public MessageResponse editMessage(Long messageId, Long userId, String newContent) {
        Message message = messageRepository.findByIdWithSender(messageId)
                .orElseThrow(() -> new MessageNotFoundException("Message not found"));
        if (!message.getSender().getId().equals(userId)) {
            throw new ForbiddenOperationException("Only the sender can edit this message");
        }
        message.setContent(newContent);
        message.setUpdatedAt(LocalDateTime.now());
        messageRepository.save(message);

        Long chatId = message.getChat().getId();
        MessageResponse response = toResponse(message, chatId, message.getSender());
        messagingTemplate.convertAndSend("/topic/chats/" + chatId + "/messages/updated", response);
        return response;
    }

    @Transactional
    public void deleteMessage(Long messageId, Long userId) {
        Message message = messageRepository.findByIdWithSender(messageId)
                .orElseThrow(() -> new MessageNotFoundException("Message not found"));
        Long chatId = message.getChat().getId();

        boolean isSender = message.getSender().getId().equals(userId);
        if (!isSender) {
            ChatParticipant participant = chatParticipantRepository
                    .findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, userId)
                    .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));
            if (participant.getRole() != ParticipantRole.ADMIN && participant.getRole() != ParticipantRole.OWNER) {
                throw new ForbiddenOperationException("Only the sender or chat admin can delete this message");
            }
        }

        messageRepository.delete(message);
        messagingTemplate.convertAndSend(
                "/topic/chats/" + chatId + "/messages/deleted",
                new MessageDeletedEvent(messageId, chatId)
        );
    }

    private static MessageResponse toResponse(Message m, Long chatId, User sender) {
        LocalDateTime editedAt = (m.getUpdatedAt() != null && !m.getUpdatedAt().equals(m.getCreatedAt()))
                ? m.getUpdatedAt() : null;
        return new MessageResponse(
                m.getId(),
                chatId,
                sender.getId(),
                sender.getUsername(),
                m.getContent(),
                m.getContentType(),
                m.getAttachmentUrl(),
                m.getAttachmentName(),
                m.getReplyToMessageId(),
                m.getCreatedAt(),
                editedAt
        );
    }
}
