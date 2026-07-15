package com.hiliving.catalog.seed;

import com.hiliving.catalog.brand.persistence.BrandEntity;
import com.hiliving.catalog.brand.persistence.BrandRepository;
import com.hiliving.catalog.category.persistence.CategoryEntity;
import com.hiliving.catalog.category.persistence.CategoryRepository;
import com.hiliving.catalog.product.persistence.ProductEntity;
import com.hiliving.catalog.product.persistence.ProductRepository;
import com.hiliving.catalog.product.persistence.ProductStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@Profile("local")
public class CatalogDevelopmentDataSeeder implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(CatalogDevelopmentDataSeeder.class);

    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;

    public CatalogDevelopmentDataSeeder(
            CategoryRepository categoryRepository,
            BrandRepository brandRepository,
            ProductRepository productRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (categoryRepository.count() > 0 || brandRepository.count() > 0 || productRepository.count() > 0) {
            LOGGER.info("Catalog already contains data; local seed was skipped");
            return;
        }

        CategoryEntity household = categoryRepository.save(CategoryEntity.create(
                "Household",
                "household",
                null,
                10,
                true
        ));
        CategoryEntity cleaning = categoryRepository.save(CategoryEntity.create(
                "Cleaning",
                "cleaning",
                household,
                20,
                true
        ));
        CategoryEntity wellness = categoryRepository.save(CategoryEntity.create(
                "Wellness",
                "wellness",
                null,
                30,
                true
        ));

        BrandEntity hiLiving = brandRepository.save(BrandEntity.create(
                "HiLiving",
                "hiliving",
                "/hiLivingLogo.svg",
                true
        ));
        BrandEntity tezBlanc = brandRepository.save(BrandEntity.create(
                "Tez Blanc",
                "tez-blanc",
                "/brands/tezblanc.png",
                true
        ));

        ProductEntity cleaner = ProductEntity.create(
                "Plant-Based Household Cleaner",
                "plant-based-household-cleaner",
                "A concentrated cleaner for everyday household surfaces.",
                "Local development sample used to verify catalog reads and filtering.",
                new BigDecimal("65000.00"),
                new BigDecimal("50000.00"),
                cleaning,
                tezBlanc,
                ProductStatus.ACTIVE,
                true
        );
        cleaner.addImage("/product-cleaner.svg", "Plant-based household cleaner", 0, true);
        productRepository.save(cleaner);

        ProductEntity wellnessKit = ProductEntity.create(
                "Daily Wellness Kit",
                "daily-wellness-kit",
                "A simple local sample for the wellness catalog.",
                null,
                new BigDecimal("45000.00"),
                null,
                wellness,
                hiLiving,
                ProductStatus.ACTIVE,
                false
        );
        wellnessKit.addImage("/health.png", "Daily wellness kit", 0, true);
        productRepository.save(wellnessKit);

        ProductEntity draft = ProductEntity.create(
                "Draft Catalog Sample",
                "draft-catalog-sample",
                "This local record verifies public visibility rules.",
                null,
                new BigDecimal("10000.00"),
                null,
                cleaning,
                hiLiving,
                ProductStatus.DRAFT,
                false
        );
        productRepository.save(draft);

        LOGGER.info("Created local-only catalog verification data");
    }
}
