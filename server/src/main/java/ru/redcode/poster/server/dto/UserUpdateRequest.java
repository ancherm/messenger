package ru.redcode.poster.server.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import ru.redcode.poster.server.model.enums.UserStatus;

@Getter
@Setter
public class UserUpdateRequest {

    @Size(max = 50)
    private String firstName;

    @Size(max = 50)
    private String lastName;

    @Size(max = 100)
    private String phone;

    @Size(max = 255)
    private String avatarUrl;

    private UserStatus status;
}
