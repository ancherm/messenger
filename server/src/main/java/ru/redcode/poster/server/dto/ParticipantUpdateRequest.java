package ru.redcode.poster.server.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import ru.redcode.poster.server.model.enums.ParticipantRole;

@Getter
@Setter
public class ParticipantUpdateRequest {

    @NotNull
    private ParticipantRole role;
}
