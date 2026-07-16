package com.hiliving.catalog.category.admin;

import com.hiliving.admin.audit.AuditService;
import com.hiliving.api.error.ApiRequestException;
import com.hiliving.catalog.category.persistence.*;
import com.hiliving.catalog.product.persistence.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class AdminCategoryService {
    private final CategoryRepository categories;
    private final ProductRepository products;
    private final AuditService audit;
    public AdminCategoryService(CategoryRepository categories, ProductRepository products, AuditService audit) {
        this.categories = categories; this.products = products; this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<AdminCategoryResponse> list(String search) {
        String needle = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        return categories.findAll().stream()
                .filter(c -> needle.isEmpty() || c.getName().toLowerCase(Locale.ROOT).contains(needle) || c.getSlug().contains(needle))
                .sorted(Comparator.comparingInt(CategoryEntity::getDisplayOrder).thenComparing(CategoryEntity::getName))
                .map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public AdminCategoryResponse find(Long id) { return response(require(id)); }

    @Transactional
    public AdminCategoryResponse create(AdminCategoryRequest request) {
        ensureSlug(request.slug(), null);
        CategoryEntity parent = parent(request.parentId(), null);
        CategoryEntity category = CategoryEntity.create(clean(request.name()), request.slug(), parent, request.sortOrder(), request.active());
        category.update(clean(request.name()), request.slug(), parent, cleanNullable(request.description()), request.sortOrder(), request.active());
        categories.saveAndFlush(category);
        audit.record("CATEGORY_CREATED", "CATEGORY", category.getId(), category.getSlug());
        return response(category);
    }

    @Transactional
    public AdminCategoryResponse update(Long id, AdminCategoryRequest request) {
        CategoryEntity category = require(id);
        ensureSlug(request.slug(), id);
        CategoryEntity parent = parent(request.parentId(), id);
        ensureNoCycle(category, parent);
        boolean wasActive = category.isActive();
        category.update(clean(request.name()), request.slug(), parent, cleanNullable(request.description()), request.sortOrder(), request.active());
        categories.flush();
        audit.record(wasActive && !request.active() ? "CATEGORY_DEACTIVATED" : "CATEGORY_UPDATED", "CATEGORY", id, request.slug());
        return response(category);
    }

    @Transactional
    public void delete(Long id) {
        CategoryEntity category = require(id);
        if (categories.existsByParentId(id)) conflict("CATEGORY_HAS_CHILDREN", "Category has child categories");
        if (products.countByCategoryId(id) > 0) conflict("CATEGORY_HAS_PRODUCTS", "Category is used by products");
        categories.delete(category);
        audit.record("CATEGORY_DELETED", "CATEGORY", id, category.getSlug());
    }

    private CategoryEntity parent(Long parentId, Long selfId) {
        if (parentId == null) return null;
        if (Objects.equals(parentId, selfId)) conflict("CATEGORY_CYCLE", "Category cannot be its own parent");
        return require(parentId);
    }
    private void ensureNoCycle(CategoryEntity category, CategoryEntity parent) {
        Set<Long> seen = new HashSet<>();
        while (parent != null) {
            if (Objects.equals(parent.getId(), category.getId()) || !seen.add(parent.getId()))
                conflict("CATEGORY_CYCLE", "Category hierarchy cannot contain a cycle");
            parent = parent.getParent();
        }
    }
    private void ensureSlug(String slug, Long id) {
        boolean exists = id == null ? categories.findBySlug(slug).isPresent() : categories.existsBySlugAndIdNot(slug, id);
        if (exists) conflict("CATEGORY_SLUG_CONFLICT", "Category slug is already in use");
    }
    private CategoryEntity require(Long id) { return categories.findById(id).orElseThrow(() -> new ApiRequestException(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "Category was not found")); }
    private AdminCategoryResponse response(CategoryEntity c) {
        return new AdminCategoryResponse(c.getId(), c.getName(), c.getSlug(), c.getParent() == null ? null : c.getParent().getId(),
                c.getParent() == null ? null : c.getParent().getName(), c.getDescription(), c.getDisplayOrder(), c.isActive(),
                categories.countByParentId(c.getId()),
                products.countByCategoryId(c.getId()));
    }
    private static String clean(String value) { return value.trim(); }
    private static String cleanNullable(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static void conflict(String code, String message) { throw new ApiRequestException(HttpStatus.CONFLICT, code, message); }
}
