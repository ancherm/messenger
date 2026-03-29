package ru.redcode.poster.server.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.redcode.poster.server.dto.UserResponse;
import ru.redcode.poster.server.dto.UserStatusRequest;
import ru.redcode.poster.server.dto.UserUpdateRequest;
import ru.redcode.poster.server.model.CustomUserDetails;
import ru.redcode.poster.server.service.UserService;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal CustomUserDetails user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.getMe(user.getId()));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateMe(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.updateMe(user.getId(), request));
    }

    @PatchMapping("/me/status")
    public ResponseEntity<UserResponse> updateStatus(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody UserStatusRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.updateStatus(user.getId(), request.getStatus()));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<UserResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @GetMapping
    public ResponseEntity<Page<UserResponse>> search(
            @RequestParam(value = "query", required = false) String query,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(userService.search(query, pageable));
    }
}
