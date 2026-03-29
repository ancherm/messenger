package ru.redcode.poster.server.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import ru.redcode.poster.server.model.enums.ChatType;

import java.util.List;

@Getter
@Setter
public class ChatCreateRequest {

    @NotNull
    private ChatType type;

    @Size(max = 100)
    private String title;

    @Size(max = 500)
    private String description;

    @Size(max = 255)
    private String avatarUrl;

    /** Required when type is PRIVATE — the other user. */
    private Long peerUserId;

    /** Additional members for GROUP / CHANNEL (excluding creator). */
    private List<Long> participantIds;
}
