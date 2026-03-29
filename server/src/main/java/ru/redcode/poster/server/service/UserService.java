package ru.redcode.poster.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.redcode.poster.server.dto.UserResponse;
import ru.redcode.poster.server.dto.UserStatusRequest;
import ru.redcode.poster.server.dto.UserUpdateRequest;
import ru.redcode.poster.server.exceptions.UserNotFoundException;
import ru.redcode.poster.server.model.User;
import ru.redcode.poster.server.model.enums.UserStatus;
import ru.redcode.poster.server.repository.UserRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        return toResponse(user, true);
    }

    @Transactional
    public UserResponse updateMe(Long userId, UserUpdateRequest dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (dto.getFirstName() != null) {
            user.setFirstName(dto.getFirstName());
        }
        if (dto.getLastName() != null) {
            user.setLastName(dto.getLastName());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        if (dto.getAvatarUrl() != null) {
            user.setAvatarUrl(dto.getAvatarUrl());
        }
        if (dto.getStatus() != null) {
            user.setStatus(dto.getStatus());
        }

        userRepository.save(user);
        return toResponse(user, true);
    }

    @Transactional
    public UserResponse updateStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        user.setStatus(status);
        if (status == UserStatus.OFFLINE) {
            user.setLastSeenAt(LocalDateTime.now());
        }
        userRepository.save(user);
        return toResponse(user, true);
    }

    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        return toResponse(user, false);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> search(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        String q = query.trim();
        String onlyDigits = q.replaceAll("[^0-9]", "");

        if (onlyDigits.length() >= 7 && onlyDigits.length() == q.length()) {
            String phone10 = onlyDigits.substring(Math.max(0, onlyDigits.length() - 10));
            return userRepository.findByPhoneEndingWith(phone10, pageable)
                    .map(u -> toResponse(u, false));
        }

        return userRepository.findByUsernameIgnoreCase(q, pageable)
                .map(u -> toResponse(u, false));
    }

    private static UserResponse toResponse(User user, boolean includeEmail) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                includeEmail ? user.getEmail() : null,
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getAvatarUrl(),
                user.getStatus(),
                user.getLastSeenAt(),
                user.getCreatedAt(),
                user.isActive()
        );
    }
}
