package com.hiliving.catalog.product.api;

import com.hiliving.api.ApiResponse;
import com.hiliving.api.PagedResponse;
import com.hiliving.catalog.product.application.ProductSearchCriteria;
import com.hiliving.catalog.product.application.ProductService;
import com.hiliving.catalog.product.application.ProductSortOption;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private static final String SLUG_PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$";

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ApiResponse<PagedResponse<ProductSummaryResponse>> findAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) @Size(max = 160) @Pattern(regexp = SLUG_PATTERN) String category,
            @RequestParam(required = false) @Size(max = 160) @Pattern(regexp = SLUG_PATTERN) String brand,
            @RequestParam(required = false) @Size(max = 100) String search,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(defaultValue = "newest") String sort
    ) {
        ProductSearchCriteria criteria = new ProductSearchCriteria(
                page,
                size,
                category,
                brand,
                search,
                featured,
                ProductSortOption.fromApiValue(sort)
        );
        return ApiResponse.of(productService.findPublicProducts(criteria));
    }

    @GetMapping("/{slug}")
    public ApiResponse<ProductDetailResponse> findBySlug(
            @PathVariable @Size(max = 260) @Pattern(regexp = SLUG_PATTERN) String slug
    ) {
        return ApiResponse.of(productService.findPublicProduct(slug));
    }
}
