package com.hiliving.commerce.order;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    @EntityGraph(attributePaths = {"items", "addressSnapshot"})
    Optional<OrderEntity> findByCustomerIdAndIdempotencyKey(Long customerId, UUID idempotencyKey);

    @EntityGraph(attributePaths = {"items", "addressSnapshot"})
    Optional<OrderEntity> findByOrderNumberAndCustomerId(String orderNumber, Long customerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"items", "addressSnapshot"})
    @Query("select order from OrderEntity order where order.orderNumber = :orderNumber")
    Optional<OrderEntity> findByOrderNumberForUpdate(@Param("orderNumber") String orderNumber);
}
