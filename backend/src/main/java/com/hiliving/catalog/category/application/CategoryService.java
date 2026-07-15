package com.hiliving.catalog.category.application;

import com.hiliving.catalog.category.api.CategoryResponse;
import com.hiliving.catalog.category.persistence.CategoryEntity;
import com.hiliving.catalog.category.persistence.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> findPublicCategories() {
        return categoryRepository.findAllByActiveTrueOrderByDisplayOrderAscNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    private CategoryResponse toResponse(CategoryEntity category) {
        String parentSlug = category.getParent() != null && category.getParent().isActive()
                ? category.getParent().getSlug()
                : null;
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                parentSlug,
                category.getDisplayOrder()
        );
    }
}
