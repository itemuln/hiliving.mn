package com.hiliving.catalog.brand.api;

import com.hiliving.api.ApiResponse;
import com.hiliving.catalog.brand.application.BrandService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/brands")
public class BrandController {

    private final BrandService brandService;

    public BrandController(BrandService brandService) {
        this.brandService = brandService;
    }

    @GetMapping
    public ApiResponse<List<BrandResponse>> findAll() {
        return ApiResponse.of(brandService.findPublicBrands());
    }
}
