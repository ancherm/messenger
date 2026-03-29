package ru.redcode.poster.server.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import ru.redcode.poster.server.model.enums.UserStatus;

@Getter
@Setter
public class UserStatusRequest {

    @NotNull
    private UserStatus status;
}
