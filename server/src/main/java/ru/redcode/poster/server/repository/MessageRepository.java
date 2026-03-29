package ru.redcode.poster.server.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.redcode.poster.server.model.Message;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m JOIN FETCH m.sender WHERE m.id = :id")
    Optional<Message> findByIdWithSender(@Param("id") Long id);

    @Query("""
            SELECT m FROM Message m
            JOIN FETCH m.sender
            WHERE m.chat.id = :chatId
            AND (:before IS NULL OR m.id < :before)
            AND (:after IS NULL OR m.id > :after)
            AND (:search IS NULL OR LOWER(m.content) LIKE :search)
            ORDER BY m.id DESC
            """)
    List<Message> findMessages(
            @Param("chatId") Long chatId,
            @Param("before") Long before,
            @Param("after") Long after,
            @Param("search") String search,
            Pageable pageable
    );
}
