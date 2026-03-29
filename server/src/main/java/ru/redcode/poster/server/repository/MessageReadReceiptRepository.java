package ru.redcode.poster.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.redcode.poster.server.model.MessageReadReceipt;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReadReceiptRepository extends JpaRepository<MessageReadReceipt, Long> {

    Optional<MessageReadReceipt> findByMessage_IdAndUser_Id(Long messageId, Long userId);

    @Query("""
            SELECT r FROM MessageReadReceipt r
            JOIN FETCH r.user
            WHERE r.message.id = :messageId
            ORDER BY r.readAt ASC
            """)
    List<MessageReadReceipt> findByMessageIdWithUser(@Param("messageId") Long messageId);
}
