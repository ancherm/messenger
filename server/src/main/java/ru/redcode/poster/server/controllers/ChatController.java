package ru.redcode.poster.server.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.redcode.poster.server.dto.ChatCreateRequest;
import ru.redcode.poster.server.dto.ChatMessageInbound;
import ru.redcode.poster.server.dto.ChatResponse;
import ru.redcode.poster.server.dto.ChatUpdateRequest;
import ru.redcode.poster.server.dto.ChatWithParticipantsResponse;
import ru.redcode.poster.server.dto.MessageResponse;
import ru.redcode.poster.server.model.CustomUserDetails;
import ru.redcode.poster.server.service.ChatMessageService;
import ru.redcode.poster.server.service.ChatService;
import ru.redcode.poster.server.service.PinService;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ChatMessageService chatMessageService;
    private final PinService pinService;

    @GetMapping
    public ResponseEntity<List<ChatResponse>> list(@AuthenticationPrincipal CustomUserDetails user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(chatService.listMyChats(user.getId()));
    }

    @PostMapping
    public ResponseEntity<ChatResponse> create(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody ChatCreateRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.createChat(user.getId(), request));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ChatResponse>> search(
            @RequestParam(value = "query", required = false) String query,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(chatService.searchChats(query, pageable));
    }

    @GetMapping("/{chatId:\\d+}")
    public ResponseEntity<ChatWithParticipantsResponse> getOne(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(chatService.getChatWithParticipants(chatId, user.getId()));
    }

    @PatchMapping("/{chatId:\\d+}")
    public ResponseEntity<ChatResponse> update(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId,
            @Valid @RequestBody ChatUpdateRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(chatService.updateChat(chatId, user.getId(), request));
    }

    @DeleteMapping("/{chatId:\\d+}")
    public ResponseEntity<Void> deleteOrLeave(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        chatService.deleteOrLeaveChat(chatId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{chatId:\\d+}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId,
            @Valid @RequestBody ChatMessageInbound request
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatMessageService.sendMessage(chatId, user.getId(), request));
    }

    @PostMapping("/{chatId:\\d+}/pin")
    public ResponseEntity<Void> pinChat(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId
    ) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        pinService.pinChat(chatId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{chatId:\\d+}/pin")
    public ResponseEntity<Void> unpinChat(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId
    ) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        pinService.unpinChat(chatId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{chatId:\\d+}/messages/{messageId:\\d+}/pin")
    public ResponseEntity<Void> pinMessage(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId,
            @PathVariable Long messageId
    ) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        pinService.pinMessage(chatId, messageId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{chatId:\\d+}/messages/{messageId:\\d+}/pin")
    public ResponseEntity<Void> unpinMessage(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId,
            @PathVariable Long messageId
    ) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        pinService.unpinMessage(chatId, messageId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{chatId:\\d+}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long chatId,
            @RequestParam(required = false) Long before,
            @RequestParam(required = false) Long after,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(required = false) String search
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(chatMessageService.getMessages(chatId, user.getId(), before, after, limit, search));
    }
}
