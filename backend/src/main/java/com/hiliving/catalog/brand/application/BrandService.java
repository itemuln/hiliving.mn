package com.hiliving.catalog.brand.application;

import com.hiliving.catalog.brand.api.BrandResponse;
import com.hiliving.catalog.brand.persistence.BrandEntity;
import com.hiliving.catalog.brand.persistence.BrandRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BrandService {

    private final BrandRepository brandRepository;

    public BrandService(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    @Transactional(readOnly = true)
    public List<BrandResponse> findPublicBrands() {
        return brandRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    private BrandResponse toResponse(BrandEntity brand) {
        return new BrandResponse(brand.getId(), brand.getName(), brand.getSlug(), brand.getLogoUrl());
    }
}
