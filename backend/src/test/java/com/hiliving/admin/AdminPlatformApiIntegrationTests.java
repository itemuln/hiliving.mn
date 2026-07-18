package com.hiliving.admin;

import com.hiliving.TestcontainersConfiguration;
import com.hiliving.catalog.category.persistence.CategoryEntity;
import com.hiliving.catalog.category.persistence.CategoryRepository;
import com.hiliving.catalog.product.persistence.ProductRepository;
import com.hiliving.catalog.product.persistence.ProductStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest
@Transactional
class AdminPlatformApiIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;

    @Test
    void adminBoundaryReturns401ForAnonymousAnd403ForCustomer() throws Exception {
        mvc.perform(get("/api/v1/admin/dashboard")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("AUTHENTICATION_REQUIRED"));
        mvc.perform(get("/api/v1/admin/dashboard").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("customer").roles("CUSTOMER")))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));
    }

    @Test @WithMockUser(username="admin@example.com",roles="ADMIN")
    void categoriesSupportCreateSearchUpdateAndCycleProtection() throws Exception {
        var created=mvc.perform(post("/api/v1/admin/categories").with(admin()).with(csrf()).contentType("application/json").content("""
                {"name":"Administration","slug":"administration","description":"Managed","sortOrder":2,"active":true}
                """)).andExpect(status().isCreated()).andExpect(jsonPath("$.data.productCount").value(0)).andReturn();
        long id=((Number)com.jayway.jsonpath.JsonPath.read(created.getResponse().getContentAsString(),"$.data.id")).longValue();
        mvc.perform(get("/api/v1/admin/categories").with(admin()).param("search","admin"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1));
        mvc.perform(patch("/api/v1/admin/categories/{id}",id).with(admin()).with(csrf()).contentType("application/json").content("""
                {"name":"Administration","slug":"administration","parentId":%d,"description":"Managed","sortOrder":2,"active":false}
                """.formatted(id))).andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("CATEGORY_CYCLE"));
    }

    @Test @WithMockUser(username="admin@example.com",roles="ADMIN")
    void productRulesExposeInventoryMembershipAndArchiveVisibility() throws Exception {
        CategoryEntity category=categories.save(CategoryEntity.create("Admin Product","admin-product",null,0,true));
        String active="""
                {"name":"Монгол Өргөө","description":"Managed product details","basePrice":100,"discountPrice":80,"categoryId":%d,"brandId":null,"lifecycle":"ACTIVE","stockQuantity":3,"lowStockThreshold":5,"featured":true,"newProduct":true,"active":true,"membershipDiscountEligible":false,"images":[{"imageUrl":"https://example.com/product.jpg","altText":"Product","sortOrder":0,"primaryImage":true}]}
                """.formatted(category.getId());
        var result=mvc.perform(post("/api/v1/admin/products").with(admin()).with(csrf()).contentType("application/json").content(active))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.inventoryState").value("LOW_STOCK"))
                .andExpect(jsonPath("$.data.membershipDiscountEligible").value(false))
                .andExpect(jsonPath("$.data.slug").value("mongol-orgoo"))
                .andExpect(jsonPath("$.data.productCode").value(org.hamcrest.Matchers.matchesPattern("PRD-[0-9]{6,}")))
                .andExpect(jsonPath("$.data.shortDescription").value("Managed product details"))
                .andExpect(jsonPath("$.data.description").value("Managed product details"))
                .andReturn();
        long id=((Number)com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(),"$.data.id")).longValue();
        String productCode=com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(),"$.data.productCode");

        mvc.perform(post("/api/v1/admin/products").with(admin()).with(csrf()).contentType("application/json").content(active))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.slug").value("mongol-orgoo-2"))
                .andExpect(jsonPath("$.data.productCode").value(org.hamcrest.Matchers.matchesPattern("PRD-[0-9]{6,}")))
                .andExpect(jsonPath("$.data.productCode").value(org.hamcrest.Matchers.not(productCode)));

        org.assertj.core.api.Assertions.assertThat(products.findPublicBySlug("mongol-orgoo", ProductStatus.ACTIVE)).isPresent();
        mvc.perform(get("/api/v1/products/mongol-orgoo")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/admin/products").with(admin()).param("search",productCode))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].productCode").value(productCode));

        String renamed=active.replace("\"name\":\"Монгол Өргөө\"","\"name\":\"Шинэ Бүтээгдэхүүн\"");
        mvc.perform(patch("/api/v1/admin/products/{id}",id).with(admin()).with(csrf()).contentType("application/json").content(renamed))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Шинэ Бүтээгдэхүүн"))
                .andExpect(jsonPath("$.data.slug").value("mongol-orgoo"))
                .andExpect(jsonPath("$.data.productCode").value(productCode))
                .andExpect(jsonPath("$.data.images[0].imageUrl").value("https://example.com/product.jpg"));
        mvc.perform(get("/api/v1/products/mongol-orgoo")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Шинэ Бүтээгдэхүүн"));
        mvc.perform(get("/api/v1/products/shine-buteegdehuun")).andExpect(status().isNotFound());

        mvc.perform(post("/api/v1/admin/products/{id}/archive",id).with(admin()).with(csrf())).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lifecycle").value("ARCHIVED"));
        mvc.perform(get("/api/v1/products/mongol-orgoo")).andExpect(status().isNotFound());
        String invalid=active.replace("\"name\":\"Монгол Өргөө\"","\"name\":\"Invalid Product\"").replace("\"discountPrice\":80","\"discountPrice\":100");
        mvc.perform(post("/api/v1/admin/products").with(admin()).with(csrf()).contentType("application/json").content(invalid))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("INVALID_DISCOUNT_PRICE"));
    }

    @Test @WithMockUser(username="admin@example.com",roles="ADMIN")
    void bannersAndNewsRespectPublicSchedulingAndPublication() throws Exception {
        mvc.perform(post("/api/v1/admin/banners").with(admin()).with(csrf()).contentType("application/json").content("""
                {"title":"Public banner","imageUrl":"https://example.com/banner.jpg","sortOrder":1,"active":true}
                """)).andExpect(status().isCreated());
        mvc.perform(get("/api/v1/banners")).andExpect(status().isOk()).andExpect(jsonPath("$.data[0].title").value("Public banner"));
        mvc.perform(post("/api/v1/admin/news").with(admin()).with(csrf()).contentType("application/json").content("""
                {"title":"Draft","slug":"draft-news","summary":"Summary","content":"Content","published":false,"sortOrder":0}
                """)).andExpect(status().isCreated());
        mvc.perform(get("/api/v1/news")).andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
        mvc.perform(post("/api/v1/admin/news").with(admin()).with(csrf()).contentType("application/json").content("""
                {"title":"Published","slug":"published-news","summary":"Summary","content":"Content","published":true,"sortOrder":0}
                """)).andExpect(status().isCreated());
        mvc.perform(get("/api/v1/news/published-news")).andExpect(status().isOk()).andExpect(jsonPath("$.data.title").value("Published"));
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor admin() {
        return user("admin@example.com").roles("ADMIN");
    }
}
