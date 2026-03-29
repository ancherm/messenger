package ru.redcode.poster.server.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import ru.redcode.poster.server.model.enums.MessageType;

@Getter
@Setter
public class ChatMessageInbound {

    @Size(max = 4000)
    private String content;

    private MessageType contentType;

    @Size(max = 500)
    private String attachmentUrl;

    @Size(max = 255)
    private String attachmentName;

    private Long replyToMessageId;
}
