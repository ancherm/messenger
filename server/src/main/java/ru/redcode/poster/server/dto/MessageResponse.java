package ru.redcode.poster.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ru.redcode.poster.server.model.enums.MessageType;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private Long id;
    private Long chatId;
    private Long senderId;
    private String senderUsername;
    private String content;
    private MessageType contentType;
    private String attachmentUrl;
    private String attachmentName;
    private Long replyToMessageId;
    private LocalDateTime createdAt;
    private LocalDateTime editedAt;
}
