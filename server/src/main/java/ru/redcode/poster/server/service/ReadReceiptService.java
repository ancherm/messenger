package ru.redcode.poster.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.redcode.poster.server.dto.MessageReadReceiptResponse;
import ru.redcode.poster.server.dto.UserResponse;
import ru.redcode.poster.server.exceptions.ChatNotFoundException;
import ru.redcode.poster.server.exceptions.ForbiddenOperationException;
import ru.redcode.poster.server.exceptions.MessageNotFoundException;
import ru.redcode.poster.server.model.Chat;
import ru.redcode.poster.server.model.Message;
import ru.redcode.poster.server.model.MessageReadReceipt;
import ru.redcode.poster.server.model.User;
import ru.redcode.poster.server.model.enums.ChatType;
import ru.redcode.poster.server.repository.ChatParticipantRepository;
import ru.redcode.poster.server.repository.ChatRepository;
import ru.redcode.poster.server.repository.MessageReadReceiptRepository;
import ru.redcode.poster.server.repository.MessageRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReadReceiptService {

    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final MessageReadReceiptRepository readReceiptRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void markAsRead(Long chatId, Long messageId, Long userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatNotFoundException("Chat not found"));

        chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, userId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new MessageNotFoundException("Message not found"));

        if (!message.getChat().getId().equals(chatId)) {
            throw new MessageNotFoundException("Message not found in this chat");
        }

        // Не создавать дубликат — idempotent
        boolean alreadyRead = readReceiptRepository
                .findByMessage_IdAndUser_Id(messageId, userId)
                .isPresent();
        if (alreadyRead) {
            return;
        }

        var participant = chatParticipantRepository
                .findByChat_IdAndUser_Id(chatId, userId)
                .orElseThrow();

        MessageReadReceipt receipt = new MessageReadReceipt();
        receipt.setMessage(message);
        receipt.setUser(participant.getUser());
        receipt.setChatId(chatId);
        receipt.setReadAt(LocalDateTime.now());
        readReceiptRepository.save(receipt);

        // Для PRIVATE чата достаточно просто сохранить — не бродкастим список
        // Для GROUP / CHANNEL бродкастим событие, чтобы отправитель видел "прочитано"
        if (chat.getType() != ChatType.PRIVATE) {
            MessageReadReceiptResponse event = toResponse(receipt);
            messagingTemplate.convertAndSend(
                    "/topic/chats/" + chatId + "/messages/" + messageId + "/read",
                    event
            );
        }
    }

    @Transactional(readOnly = true)
    public List<MessageReadReceiptResponse> getReaders(Long chatId, Long messageId, Long userId) {
        if (!chatRepository.existsById(chatId)) {
            throw new ChatNotFoundException("Chat not found");
        }
        chatParticipantRepository.findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, userId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new MessageNotFoundException("Message not found"));

        if (!message.getChat().getId().equals(chatId)) {
            throw new MessageNotFoundException("Message not found in this chat");
        }

        return readReceiptRepository.findByMessageIdWithUser(messageId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private MessageReadReceiptResponse toResponse(MessageReadReceipt r) {
        User u = r.getUser();
        UserResponse userResponse = new UserResponse(
                u.getId(),
                u.getUsername(),
                null,
                u.getFirstName(),
                u.getLastName(),
                null,
                u.getAvatarUrl(),
                u.getStatus(),
                u.getLastSeenAt(),
                u.getCreatedAt(),
                u.isActive()
        );
        return new MessageReadReceiptResponse(userResponse, r.getReadAt());
    }
}
