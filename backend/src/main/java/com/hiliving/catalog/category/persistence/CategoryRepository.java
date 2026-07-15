package com.hiliving.catalog.category.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {

    List<CategoryEntity> findAllByActiveTrueOrderByDisplayOrderAscNameAsc();

    Optional<CategoryEntity> findBySlug(String slug);
}
