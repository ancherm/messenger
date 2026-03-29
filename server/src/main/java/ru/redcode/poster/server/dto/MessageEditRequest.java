package ru.redcode.poster.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageEditRequest {

    @NotBlank
    @Size(max = 4000)
    private String content;
}
