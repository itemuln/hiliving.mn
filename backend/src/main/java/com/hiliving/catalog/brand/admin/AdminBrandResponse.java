package com.hiliving.catalog.brand.admin;

public record AdminBrandResponse(Long id, String name, String slug, String logoUrl, String description,
                                 int sortOrder, boolean active, long productCount) {}
