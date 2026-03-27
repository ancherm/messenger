package ru.redcode.poster.server.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.redcode.poster.server.dto.RegisterRequest;
import ru.redcode.poster.server.model.CustomUserDetails;
import ru.redcode.poster.server.utils.SecurityUtils;

import java.util.Map;

@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
public class Test {

    @GetMapping
    public ResponseEntity<Map<String, Long>> test(@AuthenticationPrincipal CustomUserDetails user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(Map.of("userId", user.getId()));
    }
}
