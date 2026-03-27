package ru.redcode.poster.server.dto;

import java.time.Instant;

public record ApiError(
        int status,
        String error,
        String message,
        Instant timestamp
) {}