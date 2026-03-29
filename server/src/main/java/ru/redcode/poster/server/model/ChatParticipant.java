package ru.redcode.poster.server.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import ru.redcode.poster.server.model.enums.ParticipantRole;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "chat_participants",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"chat_id", "user_id"}
        )
)
@Getter
@Setter
public class ChatParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipantRole role;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    @Column(name = "is_admin", nullable = false)
    private boolean admin = false;

    @Column(name = "is_pinned", nullable = false)
    private boolean pinned = false;
}

