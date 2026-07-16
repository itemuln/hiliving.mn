package com.hiliving.catalog.brand.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BrandRepository extends JpaRepository<BrandEntity, Long> {

    List<BrandEntity> findAllByActiveTrueOrderByNameAsc();

    Optional<BrandEntity> findBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
