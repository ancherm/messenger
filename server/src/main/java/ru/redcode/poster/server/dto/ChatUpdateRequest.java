package ru.redcode.poster.server.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatUpdateRequest {

    @Size(max = 100)
    private String title;

    @Size(max = 500)
    private String description;

    @Size(max = 255)
    private String avatarUrl;
}
