package ru.redcode.poster.server.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.redcode.poster.server.dto.MessageEditRequest;
import ru.redcode.poster.server.dto.MessageResponse;
import ru.redcode.poster.server.model.CustomUserDetails;
import ru.redcode.poster.server.service.ChatMessageService;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final ChatMessageService chatMessageService;

    @GetMapping("/{messageId}")
    public ResponseEntity<MessageResponse> getOne(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long messageId
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(chatMessageService.getMessageById(messageId, user.getId()));
    }

    @PatchMapping("/{messageId}")
    public ResponseEntity<MessageResponse> edit(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long messageId,
            @Valid @RequestBody MessageEditRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(chatMessageService.editMessage(messageId, user.getId(), request.getContent()));
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long messageId
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        chatMessageService.deleteMessage(messageId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
