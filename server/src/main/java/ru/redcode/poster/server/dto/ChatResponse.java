package ru.redcode.poster.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ru.redcode.poster.server.model.enums.ChatType;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {

    private Long id;
    private ChatType type;
    private String title;
    private String description;
    private String avatarUrl;
    private Long createdById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
