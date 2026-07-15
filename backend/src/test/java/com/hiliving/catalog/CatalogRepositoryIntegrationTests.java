package com.hiliving.catalog;

import com.hiliving.TestcontainersConfiguration;
import com.hiliving.catalog.brand.persistence.BrandRepository;
import com.hiliving.catalog.category.persistence.CategoryEntity;
import com.hiliving.catalog.category.persistence.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@Transactional
class CatalogRepositoryIntegrationTests {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void repositoriesReturnOnlyActiveCategoriesAndBrands() {
        categoryRepository.save(CatalogTestFixtures.category("Active Category", "active-category", true));
        categoryRepository.save(CatalogTestFixtures.category("Inactive Category", "inactive-category", false));
        brandRepository.save(CatalogTestFixtures.brand("Active Brand", "active-brand", true));
        brandRepository.save(CatalogTestFixtures.brand("Inactive Brand", "inactive-brand", false));

        assertThat(categoryRepository.findAllByActiveTrueOrderByDisplayOrderAscNameAsc())
                .extracting(CategoryEntity::getSlug)
                .containsExactly("active-category");
        assertThat(brandRepository.findAllByActiveTrueOrderByNameAsc())
                .extracting(brand -> brand.getSlug())
                .containsExactly("active-brand");
    }

    @Test
    void databaseRejectsNegativeProductPrice() {
        CategoryEntity category = categoryRepository.save(
                CatalogTestFixtures.category("Cleaning", "negative-price-cleaning", true)
        );

        assertThatThrownBy(() -> insertProduct(
                "Negative Product",
                "negative-product",
                new BigDecimal("-0.01"),
                null,
                category.getId()
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsDiscountThatIsNotLowerThanPrice() {
        CategoryEntity category = categoryRepository.save(
                CatalogTestFixtures.category("Wellness", "invalid-discount-wellness", true)
        );

        assertThatThrownBy(() -> insertProduct(
                "Invalid Discount Product",
                "invalid-discount-product",
                new BigDecimal("100.00"),
                new BigDecimal("100.00"),
                category.getId()
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    private void insertProduct(
            String name,
            String slug,
            BigDecimal price,
            BigDecimal discountPrice,
            Long categoryId
    ) {
        jdbcTemplate.update(
                """
                        insert into products (
                            name, slug, price, discount_price, category_id, status, featured
                        ) values (?, ?, ?, ?, ?, 'ACTIVE', false)
                        """,
                name,
                slug,
                price,
                discountPrice,
                categoryId
        );
    }
}
