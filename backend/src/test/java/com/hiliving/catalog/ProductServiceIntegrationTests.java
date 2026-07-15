package com.hiliving.catalog;

import com.hiliving.TestcontainersConfiguration;
import com.hiliving.api.PagedResponse;
import com.hiliving.api.error.ResourceNotFoundException;
import com.hiliving.catalog.brand.persistence.BrandEntity;
import com.hiliving.catalog.brand.persistence.BrandRepository;
import com.hiliving.catalog.category.persistence.CategoryEntity;
import com.hiliving.catalog.category.persistence.CategoryRepository;
import com.hiliving.catalog.product.api.ProductSummaryResponse;
import com.hiliving.catalog.product.application.ProductSearchCriteria;
import com.hiliving.catalog.product.application.ProductService;
import com.hiliving.catalog.product.application.ProductSortOption;
import com.hiliving.catalog.product.persistence.ProductRepository;
import com.hiliving.catalog.product.persistence.ProductStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@Transactional
class ProductServiceIntegrationTests {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductService productService;

    private CategoryEntity cleaning;
    private BrandEntity activeBrand;

    @BeforeEach
    void setUp() {
        cleaning = categoryRepository.save(CatalogTestFixtures.category("Cleaning", "service-cleaning", true));
        CategoryEntity inactiveCategory = categoryRepository.save(
                CatalogTestFixtures.category("Hidden", "service-hidden", false)
        );
        activeBrand = brandRepository.save(CatalogTestFixtures.brand("Visible Brand", "service-brand", true));
        BrandEntity inactiveBrand = brandRepository.save(
                CatalogTestFixtures.brand("Hidden Brand", "service-hidden-brand", false)
        );

        productRepository.save(CatalogTestFixtures.product(
                "Budget Cleaner",
                "service-budget-cleaner",
                "concentrated cleaner",
                new BigDecimal("100.00"),
                cleaning,
                activeBrand,
                ProductStatus.ACTIVE,
                true
        ));
        productRepository.save(CatalogTestFixtures.product(
                "Premium Cleaner",
                "service-premium-cleaner",
                "concentrated cleaner",
                new BigDecimal("200.00"),
                cleaning,
                activeBrand,
                ProductStatus.ACTIVE,
                true
        ));
        productRepository.save(CatalogTestFixtures.product(
                "Draft Cleaner",
                "service-draft-cleaner",
                "concentrated cleaner",
                new BigDecimal("50.00"),
                cleaning,
                activeBrand,
                ProductStatus.DRAFT,
                true
        ));
        productRepository.save(CatalogTestFixtures.product(
                "Hidden Category Product",
                "service-hidden-category-product",
                "concentrated cleaner",
                new BigDecimal("75.00"),
                inactiveCategory,
                activeBrand,
                ProductStatus.ACTIVE,
                true
        ));
        productRepository.save(CatalogTestFixtures.product(
                "Hidden Brand Product",
                "service-hidden-brand-product",
                "concentrated cleaner",
                new BigDecimal("80.00"),
                cleaning,
                inactiveBrand,
                ProductStatus.ACTIVE,
                true
        ));
    }

    @Test
    void serviceAppliesFiltersPaginationAndControlledPriceSorting() {
        ProductSearchCriteria criteria = new ProductSearchCriteria(
                0,
                1,
                cleaning.getSlug(),
                activeBrand.getSlug(),
                "cleaner",
                true,
                ProductSortOption.PRICE_ASC
        );

        PagedResponse<ProductSummaryResponse> page = productService.findPublicProducts(criteria);

        assertThat(page.totalElements()).isEqualTo(2);
        assertThat(page.totalPages()).isEqualTo(2);
        assertThat(page.items())
                .extracting(ProductSummaryResponse::slug)
                .containsExactly("service-budget-cleaner");
    }

    @Test
    void serviceExcludesDraftsAndProductsBehindInactiveCatalogReferences() {
        PagedResponse<ProductSummaryResponse> page = productService.findPublicProducts(
                new ProductSearchCriteria(0, 20, null, null, null, null, ProductSortOption.NAME_ASC)
        );

        assertThat(page.items())
                .extracting(ProductSummaryResponse::slug)
                .containsExactly("service-budget-cleaner", "service-premium-cleaner");
    }

    @Test
    void serviceDoesNotExposeUnknownOrNonPublicProductDetails() {
        assertThatThrownBy(() -> productService.findPublicProduct("service-draft-cleaner"))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> productService.findPublicProduct("missing-product"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
