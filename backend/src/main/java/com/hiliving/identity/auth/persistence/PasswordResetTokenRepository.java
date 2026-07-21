package com.hiliving.identity.auth.persistence;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetTokenEntity, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select token from PasswordResetTokenEntity token join fetch token.user where token.tokenHash = :hash")
    Optional<PasswordResetTokenEntity> findByHashForUpdate(@Param("hash") String hash);

    @Modifying
    @Query("update PasswordResetTokenEntity token set token.usedAt = :now where token.user.id = :userId and token.usedAt is null")
    int invalidateUnused(@Param("userId") Long userId, @Param("now") Instant now);
}
