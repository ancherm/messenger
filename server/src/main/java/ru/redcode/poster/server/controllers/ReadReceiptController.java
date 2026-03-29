package ru.redcode.poster.server.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.redcode.poster.server.dto.MessageReadReceiptResponse;
import ru.redcode.poster.server.model.CustomUserDetails;
import ru.redcode.poster.server.service.ReadReceiptService;

import java.util.List;

@RestController
@RequestMapping("/api/chats/{chatId}/messages/{messageId}")
@RequiredArgsConstructor
public class ReadReceiptController {

    private final ReadReceiptService readReceiptService;

    @PostMapping("/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId,
            @PathVariable Long messageId
    ) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        readReceiptService.markAsRead(chatId, messageId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/readers")
    public ResponseEntity<List<MessageReadReceiptResponse>> getReaders(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId,
            @PathVariable Long messageId
    ) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(readReceiptService.getReaders(chatId, messageId, user.getId()));
    }
}
