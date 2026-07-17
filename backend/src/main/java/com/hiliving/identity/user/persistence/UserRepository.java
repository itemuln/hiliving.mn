package com.hiliving.identity.user.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select user from UserEntity user join fetch user.membershipTier where user.id = :id")
    Optional<UserEntity> findByIdForUpdate(@Param("id") Long id);

    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);

    @EntityGraph(attributePaths = "membershipTier")
    Optional<UserEntity> findByEmail(String email);

    @EntityGraph(attributePaths = "membershipTier")
    Optional<UserEntity> findByPhoneNumber(String phoneNumber);

    @Override
    @EntityGraph(attributePaths = "membershipTier")
    Optional<UserEntity> findById(Long id);

    @EntityGraph(attributePaths = "membershipTier")
    @Query("""
            select user from UserEntity user
            where :search = ''
               or lower(user.firstName) like lower(concat('%', :search, '%'))
               or lower(user.lastName) like lower(concat('%', :search, '%'))
               or lower(user.email) like lower(concat('%', :search, '%'))
               or user.phoneNumber like concat('%', :search, '%')
            """)
    Page<UserEntity> search(@Param("search") String search, Pageable pageable);

    @EntityGraph(attributePaths = "membershipTier")
    @Query("""
            select user from UserEntity user
            where (:search = '' or lower(user.firstName) like lower(concat('%', :search, '%'))
               or lower(user.lastName) like lower(concat('%', :search, '%'))
               or lower(user.email) like lower(concat('%', :search, '%'))
               or user.phoneNumber like concat('%', :search, '%'))
              and (:membership = '' or user.membershipTier.code = :membership)
              and (:status = '' or cast(user.status as string) = :status)
            """)
    Page<UserEntity> searchAdmin(@Param("search") String search, @Param("membership") String membership,
                                 @Param("status") String status, Pageable pageable);
}
