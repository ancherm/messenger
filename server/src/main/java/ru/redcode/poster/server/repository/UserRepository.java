package ru.redcode.poster.server.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.redcode.poster.server.model.User;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Page<User> findByUsernameIgnoreCase(String username, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.phone LIKE CONCAT('%', :phone)")
    Page<User> findByPhoneEndingWith(@Param("phone") String phone, Pageable pageable);
}
