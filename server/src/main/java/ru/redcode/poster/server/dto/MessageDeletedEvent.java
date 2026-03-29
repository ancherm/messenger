package ru.redcode.poster.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MessageDeletedEvent {
    private Long messageId;
    private Long chatId;
}
