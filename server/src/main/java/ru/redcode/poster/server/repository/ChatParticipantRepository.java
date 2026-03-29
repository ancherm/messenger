package ru.redcode.poster.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.redcode.poster.server.model.Chat;
import ru.redcode.poster.server.model.ChatParticipant;
import ru.redcode.poster.server.model.enums.ChatType;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, Long> {

    @Query("""
            SELECT cp.chat FROM ChatParticipant cp
            WHERE cp.user.id = :userId AND cp.leftAt IS NULL
            ORDER BY cp.chat.updatedAt DESC
            """)
    List<Chat> findActiveChatsForUserOrderByUpdated(@Param("userId") Long userId);

    @Query("""
            SELECT cp FROM ChatParticipant cp
            WHERE cp.chat.id = :chatId AND cp.user.id = :userId
            """)
    Optional<ChatParticipant> findByChatIdAndUserId(@Param("chatId") Long chatId, @Param("userId") Long userId);

    Optional<ChatParticipant> findByChat_IdAndUser_Id(Long chatId, Long userId);

    Optional<ChatParticipant> findByChat_IdAndUser_IdAndLeftAtIsNull(Long chatId, Long userId);

    @Query("""
            SELECT DISTINCT c FROM Chat c
            JOIN c.participants p1
            JOIN c.participants p2
            WHERE c.type = :privateType
            AND p1.user.id = :u1 AND p2.user.id = :u2
            AND p1.leftAt IS NULL AND p2.leftAt IS NULL
            """)
    Optional<Chat> findPrivateChatBetweenUsers(
            @Param("u1") Long userId1,
            @Param("u2") Long userId2,
            @Param("privateType") ChatType privateType
    );

    @Query("""
            SELECT cp FROM ChatParticipant cp
            JOIN FETCH cp.user u
            WHERE cp.chat.id = :chatId AND cp.leftAt IS NULL
            ORDER BY cp.joinedAt ASC
            """)
    List<ChatParticipant> findByChatIdWithUserOrdered(@Param("chatId") Long chatId);
}
