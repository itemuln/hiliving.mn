package com.hiliving.catalog;

import com.hiliving.TestcontainersConfiguration;
import com.hiliving.catalog.brand.persistence.BrandEntity;
import com.hiliving.catalog.brand.persistence.BrandRepository;
import com.hiliving.catalog.category.persistence.CategoryEntity;
import com.hiliving.catalog.category.persistence.CategoryRepository;
import com.hiliving.catalog.product.persistence.ProductRepository;
import com.hiliving.catalog.product.persistence.ProductStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest
@Transactional
class CatalogApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private ProductRepository productRepository;

    private CategoryEntity activeCategory;
    private BrandEntity activeBrand;

    @BeforeEach
    void setUp() {
        activeCategory = categoryRepository.save(CatalogTestFixtures.category(
                "API Cleaning",
                "api-cleaning",
                true
        ));
        categoryRepository.save(CatalogTestFixtures.category("API Hidden", "api-hidden", false));
        activeBrand = brandRepository.save(CatalogTestFixtures.brand("API Brand", "api-brand", true));
        brandRepository.save(CatalogTestFixtures.brand("API Hidden Brand", "api-hidden-brand", false));

        productRepository.save(CatalogTestFixtures.product(
                "API Budget Cleaner",
                "api-budget-cleaner",
                "concentrated cleaner",
                new BigDecimal("100.00"),
                activeCategory,
                activeBrand,
                ProductStatus.ACTIVE,
                true
        ));
        productRepository.save(CatalogTestFixtures.product(
                "API Premium Cleaner",
                "api-premium-cleaner",
                "concentrated cleaner",
                new BigDecimal("200.00"),
                activeCategory,
                activeBrand,
                ProductStatus.ACTIVE,
                true
        ));
        productRepository.save(CatalogTestFixtures.product(
                "API Draft Cleaner",
                "api-draft-cleaner",
                "concentrated cleaner",
                new BigDecimal("50.00"),
                activeCategory,
                activeBrand,
                ProductStatus.DRAFT,
                true
        ));
    }

    @Test
    void categoriesAndBrandsReturnOnlyActiveRows() throws Exception {
        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].slug").value("api-cleaning"));

        mockMvc.perform(get("/api/v1/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].slug").value("api-brand"));
    }

    @Test
    void productsSupportPaginationFiltersAndControlledSorting() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("page", "0")
                        .param("size", "1")
                        .param("category", activeCategory.getSlug())
                        .param("brand", activeBrand.getSlug())
                        .param("search", "cleaner")
                        .param("featured", "true")
                        .param("sort", "price_asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(1))
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.totalPages").value(2))
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].slug").value("api-budget-cleaner"));
    }

    @Test
    void productDetailsReturnImagesAndUnknownSlugReturnsSafe404() throws Exception {
        mockMvc.perform(get("/api/v1/products/api-budget-cleaner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug").value("api-budget-cleaner"))
                .andExpect(jsonPath("$.data.images.length()").value(1))
                .andExpect(jsonPath("$.data.images[0].primaryImage").value(true));

        mockMvc.perform(get("/api/v1/products/missing-product"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.error.message").value("Product was not found"))
                .andExpect(jsonPath("$.error.path").value("/api/v1/products/missing-product"));
    }

    @Test
    void draftProductsAreNotReturnedAndInvalidSortIsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/products").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.items[?(@.slug == 'api-draft-cleaner')]").isEmpty());

        mockMvc.perform(get("/api/v1/products").param("sort", "createdAt"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.fieldErrors[0].field").value("sort"));

        mockMvc.perform(get("/api/v1/products").param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.fieldErrors[0].field").value("size"));
    }
}
