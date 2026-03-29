package ru.redcode.poster.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ru.redcode.poster.server.model.enums.ParticipantRole;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatParticipantResponse {

    private Long userId;
    private String username;
    private ParticipantRole role;
    private LocalDateTime joinedAt;
    private LocalDateTime leftAt;
}
