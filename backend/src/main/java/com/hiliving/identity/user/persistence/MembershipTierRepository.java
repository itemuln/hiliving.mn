package com.hiliving.identity.user.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MembershipTierRepository extends JpaRepository<MembershipTierEntity, Long> {
    Optional<MembershipTierEntity> findByCodeAndActiveTrue(String code);
}
