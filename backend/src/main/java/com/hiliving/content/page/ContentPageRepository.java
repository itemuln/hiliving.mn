package com.hiliving.content.page;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContentPageRepository extends JpaRepository<ContentPageEntity, Long> {
    List<ContentPageEntity> findAllByOrderByDisplayOrderAsc();
    List<ContentPageEntity> findAllByPublishedTrueOrderByDisplayOrderAsc();
    Optional<ContentPageEntity> findBySlugAndPublishedTrue(String slug);
}
