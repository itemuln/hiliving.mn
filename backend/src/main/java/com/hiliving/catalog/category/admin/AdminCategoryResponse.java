package com.hiliving.catalog.category.admin;

public record AdminCategoryResponse(
        Long id, String name, String slug, Long parentId, String parentName, String description,
        int sortOrder, boolean active, long childCount, long productCount
) {}
