package com.hiliving.identity.user.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<UserAddressEntity, Long> {
    List<UserAddressEntity> findAllByUserIdOrderByDefaultAddressDescCreatedAtAscIdAsc(Long userId);
    Optional<UserAddressEntity> findByIdAndUserId(Long id, Long userId);
    boolean existsByIdAndUserId(Long id, Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update UserAddressEntity address set address.defaultAddress = false where address.user.id = :userId and address.defaultAddress = true and (:exceptId is null or address.id <> :exceptId)")
    int clearDefault(@Param("userId") Long userId, @Param("exceptId") Long exceptId);
}
