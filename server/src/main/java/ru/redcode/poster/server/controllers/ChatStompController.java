package ru.redcode.poster.server.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;
import ru.redcode.poster.server.dto.ChatMessageInbound;
import ru.redcode.poster.server.dto.TypingEvent;
import ru.redcode.poster.server.model.CustomUserDetails;
import ru.redcode.poster.server.service.ChatMessageService;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatStompController {

    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/api/chats/{chatId}/messages")
    public void sendMessage(
            @DestinationVariable Long chatId,
            @Payload ChatMessageInbound payload,
            Principal principal
    ) {
        if (principal == null) {
            log.warn("STOMP message without principal");
            return;
        }
        if (!(principal instanceof UsernamePasswordAuthenticationToken token)) {
            return;
        }
        if (!(token.getPrincipal() instanceof CustomUserDetails user)) {
            return;
        }
        try {
            chatMessageService.sendMessage(chatId, user.getId(), payload != null ? payload : new ChatMessageInbound());
        } catch (Exception e) {
            log.error("Failed to process chat message: {}", e.getMessage());
        }
    }

    @MessageMapping("/api/chats/{chatId}/typing")
    public void typing(
            @DestinationVariable Long chatId,
            @Payload(required = false) Boolean isTyping,
            Principal principal
    ) {
        if (!(principal instanceof UsernamePasswordAuthenticationToken token)) return;
        if (!(token.getPrincipal() instanceof CustomUserDetails user)) return;
        messagingTemplate.convertAndSend(
                "/topic/chats/" + chatId + "/typing",
                new TypingEvent(user.getId(), user.getUsername(), Boolean.TRUE.equals(isTyping))
        );
    }
}
