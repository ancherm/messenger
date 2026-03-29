package ru.redcode.poster.server.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.redcode.poster.server.model.Chat;
import ru.redcode.poster.server.model.enums.ChatType;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {

    @Query("""
            SELECT c FROM Chat c
            WHERE c.type IN (:t1, :t2)
            AND LOWER(c.title) LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    Page<Chat> searchGroupsAndChannelsByTitle(
            @Param("t1") ChatType t1,
            @Param("t2") ChatType t2,
            @Param("q") String q,
            Pageable pageable
    );
}
