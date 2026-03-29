package ru.redcode.poster.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.redcode.poster.server.exceptions.ChatNotFoundException;
import ru.redcode.poster.server.exceptions.ForbiddenOperationException;
import ru.redcode.poster.server.exceptions.MessageNotFoundException;
import ru.redcode.poster.server.model.ChatParticipant;
import ru.redcode.poster.server.model.Message;
import ru.redcode.poster.server.model.enums.ParticipantRole;
import ru.redcode.poster.server.repository.ChatParticipantRepository;
import ru.redcode.poster.server.repository.ChatRepository;
import ru.redcode.poster.server.repository.MessageRepository;

@Service
@RequiredArgsConstructor
public class PinService {

    private final ChatParticipantRepository chatParticipantRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;

    @Transactional
    public void pinChat(Long chatId, Long userId) {
        if (!chatRepository.existsById(chatId)) {
            throw new ChatNotFoundException("Chat not found");
        }
        ChatParticipant participant = chatParticipantRepository
                .findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, userId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));
        participant.setPinned(true);
        chatParticipantRepository.save(participant);
    }

    @Transactional
    public void unpinChat(Long chatId, Long userId) {
        if (!chatRepository.existsById(chatId)) {
            throw new ChatNotFoundException("Chat not found");
        }
        ChatParticipant participant = chatParticipantRepository
                .findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, userId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));
        participant.setPinned(false);
        chatParticipantRepository.save(participant);
    }

    @Transactional
    public void pinMessage(Long chatId, Long messageId, Long userId) {
        if (!chatRepository.existsById(chatId)) {
            throw new ChatNotFoundException("Chat not found");
        }
        ChatParticipant participant = chatParticipantRepository
                .findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, userId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));
        if (participant.getRole() != ParticipantRole.ADMIN && participant.getRole() != ParticipantRole.OWNER) {
            throw new ForbiddenOperationException("Only ADMIN or OWNER can pin messages");
        }
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new MessageNotFoundException("Message not found"));
        if (!message.getChat().getId().equals(chatId)) {
            throw new ForbiddenOperationException("Message does not belong to this chat");
        }
        message.setPinned(true);
        messageRepository.save(message);
    }

    @Transactional
    public void unpinMessage(Long chatId, Long messageId, Long userId) {
        if (!chatRepository.existsById(chatId)) {
            throw new ChatNotFoundException("Chat not found");
        }
        ChatParticipant participant = chatParticipantRepository
                .findByChat_IdAndUser_IdAndLeftAtIsNull(chatId, userId)
                .orElseThrow(() -> new ForbiddenOperationException("Not a member of this chat"));
        if (participant.getRole() != ParticipantRole.ADMIN && participant.getRole() != ParticipantRole.OWNER) {
            throw new ForbiddenOperationException("Only ADMIN or OWNER can unpin messages");
        }
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new MessageNotFoundException("Message not found"));
        if (!message.getChat().getId().equals(chatId)) {
            throw new ForbiddenOperationException("Message does not belong to this chat");
        }
        message.setPinned(false);
        messageRepository.save(message);
    }
}
