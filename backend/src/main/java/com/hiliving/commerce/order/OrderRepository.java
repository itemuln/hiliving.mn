package com.hiliving.commerce.order;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    @EntityGraph(attributePaths = {"items", "addressSnapshot"})
    Optional<OrderEntity> findByCustomerIdAndIdempotencyKey(Long customerId, UUID idempotencyKey);

    @EntityGraph(attributePaths = {"items", "addressSnapshot"})
    Optional<OrderEntity> findByOrderNumberAndCustomerId(String orderNumber, Long customerId);
}
