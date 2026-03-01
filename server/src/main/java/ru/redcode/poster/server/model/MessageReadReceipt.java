package ru.redcode.poster.server.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "message_read_receipts",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"message_id", "user_id", "chat_id"}
        )
)
@Getter
@Setter
public class MessageReadReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "chat_id", nullable = false)
    private Long chatId;

    @Column(name = "read_at", nullable = false)
    private LocalDateTime readAt;
}
