package ru.redcode.poster.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class MessageReadReceiptResponse {
    private UserResponse user;
    private LocalDateTime readAt;
}
