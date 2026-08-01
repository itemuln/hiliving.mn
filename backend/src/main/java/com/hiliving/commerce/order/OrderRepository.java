package com.hiliving.commerce.order;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    @EntityGraph(attributePaths = {"items", "addressSnapshot"})
    Optional<OrderEntity> findByCustomerIdAndIdempotencyKey(Long customerId, UUID idempotencyKey);

    @EntityGraph(attributePaths = {"items", "addressSnapshot"})
    Optional<OrderEntity> findByOrderNumberAndCustomerId(String orderNumber, Long customerId);

    Page<OrderEntity> findByCustomerIdOrderByPlacedAtDescIdDesc(Long customerId, Pageable pageable);

    long countByCustomerIdAndOrderStatus(Long customerId, OrderStatus orderStatus);

    @Query("""
            select order.customer.id as customerId,
                   count(order) as orderCount,
                   coalesce(sum(case when order.paymentStatus = :paidStatus then order.grandTotal else 0 end), 0) as totalPaid
            from OrderEntity order
            where order.customer.id in :customerIds
            group by order.customer.id
            """)
    List<CustomerOrderMetrics> findCustomerMetrics(@Param("customerIds") List<Long> customerIds,
                                                   @Param("paidStatus") PaymentStatus paidStatus);

    @EntityGraph(attributePaths = {"items", "addressSnapshot"})
    Optional<OrderEntity> findByOrderNumber(String orderNumber);

    @Query("""
            select order from OrderEntity order
            where (lower(order.orderNumber) like lower(concat('%', :search, '%'))
                or lower(order.customerEmailSnapshot) like lower(concat('%', :search, '%')))
              and (:orderStatus is null or order.orderStatus = :orderStatus)
              and (:paymentStatus is null or order.paymentStatus = :paymentStatus)
            order by order.placedAt desc, order.id desc
            """)
    Page<OrderEntity> findAdminPage(@Param("search") String search,
                                    @Param("orderStatus") OrderStatus orderStatus,
                                    @Param("paymentStatus") PaymentStatus paymentStatus,
                                    Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select order from OrderEntity order where order.id = :id")
    Optional<OrderEntity> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"items", "addressSnapshot"})
    @Query("select order from OrderEntity order where order.orderNumber = :orderNumber")
    Optional<OrderEntity> findByOrderNumberForUpdate(@Param("orderNumber") String orderNumber);
}
