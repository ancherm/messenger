package ru.redcode.poster.server.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.redcode.poster.server.dto.AddParticipantsRequest;
import ru.redcode.poster.server.dto.ChatParticipantResponse;
import ru.redcode.poster.server.dto.ParticipantUpdateRequest;
import ru.redcode.poster.server.model.CustomUserDetails;
import ru.redcode.poster.server.service.ChatService;

import java.util.List;

@RestController
@RequestMapping("/api/chats/{chatId}/participants")
@RequiredArgsConstructor
public class ParticipantController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<List<ChatParticipantResponse>> add(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId,
            @Valid @RequestBody AddParticipantsRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(chatService.addParticipants(chatId, user.getId(), request.getUserIds()));
    }

    @PatchMapping("/{userId}")
    public ResponseEntity<ChatParticipantResponse> updateRole(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId,
            @PathVariable Long userId,
            @Valid @RequestBody ParticipantUpdateRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(chatService.updateParticipantRole(chatId, user.getId(), userId, request.getRole()));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> remove(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId,
            @PathVariable Long userId
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        chatService.removeParticipant(chatId, user.getId(), userId);
        return ResponseEntity.noContent().build();
    }
}
