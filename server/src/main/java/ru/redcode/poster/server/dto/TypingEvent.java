package ru.redcode.poster.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TypingEvent {
    private Long userId;
    private String username;
    private boolean typing;
}
