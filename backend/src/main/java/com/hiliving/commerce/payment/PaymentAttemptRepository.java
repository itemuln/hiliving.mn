package com.hiliving.commerce.payment;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PaymentAttemptRepository extends JpaRepository<PaymentAttemptEntity, Long> {
    @EntityGraph(attributePaths = {"deeplinks", "order"})
    Optional<PaymentAttemptEntity> findFirstByOrderIdOrderByAttemptNumberDesc(Long orderId);

    @EntityGraph(attributePaths = {"deeplinks", "order"})
    Optional<PaymentAttemptEntity> findByCallbackTokenHash(String callbackTokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"deeplinks", "order"})
    @Query("select attempt from PaymentAttemptEntity attempt where attempt.id = :id")
    Optional<PaymentAttemptEntity> findByIdForUpdate(@Param("id") Long id);

    List<PaymentAttemptEntity> findTop50ByStatusInAndExpiresAtLessThanEqualOrderByExpiresAtAscIdAsc(
            List<PaymentAttemptStatus> statuses, Instant now
    );
}
