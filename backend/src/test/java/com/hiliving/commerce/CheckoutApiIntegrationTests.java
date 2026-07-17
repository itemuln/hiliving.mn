package com.hiliving.commerce;

import com.hiliving.TestcontainersConfiguration;
import com.hiliving.catalog.CatalogTestFixtures;
import com.hiliving.catalog.brand.persistence.BrandEntity;
import com.hiliving.catalog.brand.persistence.BrandRepository;
import com.hiliving.catalog.category.persistence.CategoryEntity;
import com.hiliving.catalog.category.persistence.CategoryRepository;
import com.hiliving.catalog.product.persistence.ProductEntity;
import com.hiliving.catalog.product.persistence.ProductRepository;
import com.hiliving.catalog.product.persistence.ProductStatus;
import com.hiliving.commerce.order.OrderRepository;
import com.hiliving.identity.user.persistence.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest(properties = "hiliving.checkout.standard-shipping-fee=5000.00")
@Transactional
class CheckoutApiIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired CategoryRepository categories;
    @Autowired BrandRepository brands;
    @Autowired ProductRepository products;
    @Autowired UserRepository users;
    @Autowired OrderRepository orders;

    private ProductEntity eligible;
    private ProductEntity ineligible;

    @BeforeEach
    void setUp() {
        CategoryEntity category = categories.save(CatalogTestFixtures.category("Checkout", "checkout", true));
        BrandEntity brand = brands.save(CatalogTestFixtures.brand("Checkout Brand", "checkout-brand", true));
        eligible = product("Eligible", "eligible-product", "10000.00", "9000.00", category, brand, true, 5);
        ineligible = product("Regular", "regular-product", "20000.00", null, category, brand, false, 3);
    }

    @Test
    void publicProductDetailIncludesPricingStockImagesAndDeterministicRelatedProducts() throws Exception {
        mockMvc.perform(get("/api/v1/products/eligible-product"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sku").value("ELIGIBLE-PRODUCT"))
                .andExpect(jsonPath("$.data.effectiveCustomerPrice").value(9000.0))
                .andExpect(jsonPath("$.data.availableQuantity").value(5))
                .andExpect(jsonPath("$.data.images[0].primaryImage").value(true))
                .andExpect(jsonPath("$.data.relatedProducts[0].slug").value("regular-product"));

        eligible.changeStatus(ProductStatus.DRAFT);
        products.saveAndFlush(eligible);
        mockMvc.perform(get("/api/v1/products/eligible-product"))
                .andExpect(status().isNotFound());
    }

    @Test
    void quoteUsesAnonymousCatalogPricingAndAuthenticatedMembershipOnlyWhenEligible() throws Exception {
        String body = cartJson(2, 1);
        mockMvc.perform(post("/api/v1/cart/quote").with(csrf()).contentType("application/json").content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].unitEffectivePrice").value(9000.0))
                .andExpect(jsonPath("$.data.membershipDiscountTotal").value(0.0))
                .andExpect(jsonPath("$.data.regularSubtotal").value(40000.0))
                .andExpect(jsonPath("$.data.catalogDiscountTotal").value(2000.0))
                .andExpect(jsonPath("$.data.grandTotal").value(43000.0));

        register("gold@example.com", "99112201");
        var customer = users.findByEmail("gold@example.com").orElseThrow();
        customer.changeDiscountOverride(new BigDecimal("10.00"));
        users.saveAndFlush(customer);
        MockHttpSession session = login("gold@example.com");

        mockMvc.perform(post("/api/v1/cart/quote").with(csrf()).session(session)
                        .contentType("application/json").content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].unitEffectivePrice").value(8100.0))
                .andExpect(jsonPath("$.data.items[1].unitEffectivePrice").value(20000.0))
                .andExpect(jsonPath("$.data.membershipDiscountTotal").value(1800.0))
                .andExpect(jsonPath("$.data.grandTotal").value(41200.0));
    }

    @Test
    void quotationRejectsInvalidUnpublishedOutOfStockAndExcessiveQuantities() throws Exception {
        mockMvc.perform(post("/api/v1/cart/quote").contentType("application/json")
                        .content(singleCartJson("eligible-product", 1)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/cart/quote").with(csrf()).contentType("application/json")
                        .content("{\"items\":[]}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
        mockMvc.perform(post("/api/v1/cart/quote").with(csrf()).contentType("application/json")
                        .content("{\"items\":[{\"productSlug\":\"missing\",\"quantity\":1}]}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.error.code").value("PRODUCT_NOT_FOUND"));

        eligible.changeStatus(ProductStatus.DRAFT);
        products.saveAndFlush(eligible);
        mockMvc.perform(post("/api/v1/cart/quote").with(csrf()).contentType("application/json")
                        .content(singleCartJson("eligible-product", 1)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("PRODUCT_NOT_AVAILABLE"));

        eligible.changeStatus(ProductStatus.ACTIVE);
        eligible.initializeAdministrationFields("ELIGIBLE-PRODUCT", 0, 2, true, false, true);
        products.saveAndFlush(eligible);
        mockMvc.perform(post("/api/v1/cart/quote").with(csrf()).contentType("application/json")
                        .content(singleCartJson("eligible-product", 1)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("OUT_OF_STOCK"));

        mockMvc.perform(post("/api/v1/cart/quote").with(csrf()).contentType("application/json")
                        .content(singleCartJson("regular-product", 100)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
        mockMvc.perform(post("/api/v1/cart/quote").with(csrf()).contentType("application/json")
                        .content(singleCartJson("regular-product", 4)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("QUANTITY_EXCEEDS_STOCK"));
    }

    @Test
    void orderPlacementSnapshotsValuesDeductsInventoryAndIsIdempotent() throws Exception {
        register("buyer@example.com", "99112202");
        var customer = users.findByEmail("buyer@example.com").orElseThrow();
        customer.changeDiscountOverride(new BigDecimal("10.00"));
        users.saveAndFlush(customer);
        MockHttpSession buyer = login("buyer@example.com");
        long addressId = createAddress(buyer, "Original address", "99112203");
        String key = UUID.randomUUID().toString();
        String orderBody = orderJson(addressId, 2, "Door code 12");

        MvcResult placed = mockMvc.perform(post("/api/v1/orders").with(csrf()).session(buyer)
                        .header("Idempotency-Key", key).contentType("application/json").content(orderBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.orderStatus").value("PENDING_CONFIRMATION"))
                .andExpect(jsonPath("$.data.paymentStatus").value("UNPAID"))
                .andExpect(jsonPath("$.data.paymentMethod").value("CASH_ON_DELIVERY"))
                .andExpect(jsonPath("$.data.items[0].productName").value("Eligible"))
                .andExpect(jsonPath("$.data.items[0].unitEffectivePrice").value(8100.0))
                .andExpect(jsonPath("$.data.address.addressLine").value("Original address"))
                .andReturn();
        String orderNumber = com.jayway.jsonpath.JsonPath.read(placed.getResponse().getContentAsString(), "$.data.orderNumber");

        assertThat(products.findById(eligible.getId()).orElseThrow().getStockQuantity()).isEqualTo(3);
        assertThat(orders.count()).isEqualTo(1);
        mockMvc.perform(post("/api/v1/orders").with(csrf()).session(buyer)
                        .header("Idempotency-Key", key).contentType("application/json").content(orderBody))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.orderNumber").value(orderNumber));
        assertThat(orders.count()).isEqualTo(1);
        assertThat(products.findById(eligible.getId()).orElseThrow().getStockQuantity()).isEqualTo(3);

        mockMvc.perform(get("/api/v1/orders/{orderNumber}", orderNumber).session(buyer))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.customerNote").value("Door code 12"));
    }

    @Test
    void orderSecurityOwnershipCsrfConflictingIdempotencyAndRollbackAreEnforced() throws Exception {
        register("owner-order@example.com", "99112204");
        register("other-order@example.com", "99112205");
        MockHttpSession owner = login("owner-order@example.com");
        MockHttpSession other = login("other-order@example.com");
        long addressId = createAddress(owner, "Owner address", "99112206");
        long otherAddressId = createAddress(other, "Other address", "99112207");
        String key = UUID.randomUUID().toString();
        String body = orderJson(addressId, 1, null);

        mockMvc.perform(post("/api/v1/orders").session(owner).header("Idempotency-Key", key)
                        .contentType("application/json").content(body))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/orders").with(csrf()).header("Idempotency-Key", key)
                        .contentType("application/json").content(body))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/orders").with(csrf()).session(owner)
                        .header("Idempotency-Key", UUID.randomUUID()).contentType("application/json")
                        .content(orderJson(otherAddressId, 1, null)))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.error.code").value("ADDRESS_NOT_FOUND"));
        mockMvc.perform(post("/api/v1/orders").with(csrf()).session(owner)
                        .header("Idempotency-Key", UUID.randomUUID()).contentType("application/json")
                        .content("{\"items\":[],\"addressId\":" + addressId
                                + ",\"deliveryMethod\":\"STANDARD_DELIVERY\",\"paymentMethod\":\"CASH_ON_DELIVERY\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));

        register("admin-order@example.com", "99112208");
        var admin = users.findByEmail("admin-order@example.com").orElseThrow();
        org.springframework.test.util.ReflectionTestUtils.setField(
                admin, "role", com.hiliving.identity.user.persistence.UserRole.ADMIN);
        users.saveAndFlush(admin);
        MockHttpSession adminSession = login("admin-order@example.com");
        mockMvc.perform(post("/api/v1/orders").with(csrf()).session(adminSession)
                        .header("Idempotency-Key", UUID.randomUUID()).contentType("application/json").content(body))
                .andExpect(status().isForbidden());

        String untrustedBody = body.substring(0, body.length() - 1)
                + ",\"grandTotal\":1,\"orderStatus\":\"PAID\"}";
        MvcResult placed = mockMvc.perform(post("/api/v1/orders").with(csrf()).session(owner)
                        .header("Idempotency-Key", key).contentType("application/json").content(untrustedBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.grandTotal").value(14000.0))
                .andExpect(jsonPath("$.data.orderStatus").value("PENDING_CONFIRMATION"))
                .andExpect(jsonPath("$.data.paymentStatus").value("UNPAID"))
                .andReturn();
        String orderNumber = com.jayway.jsonpath.JsonPath.read(placed.getResponse().getContentAsString(), "$.data.orderNumber");
        mockMvc.perform(get("/api/v1/orders/{orderNumber}", orderNumber).session(other))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.error.code").value("ORDER_NOT_FOUND"));
        mockMvc.perform(post("/api/v1/orders").with(csrf()).session(owner)
                        .header("Idempotency-Key", key).contentType("application/json")
                        .content(orderJson(addressId, 2, null)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error.code").value("DUPLICATE_ORDER_SUBMISSION"));

        int before = ineligible.getStockQuantity();
        String failing = "{\"items\":[{\"productSlug\":\"regular-product\",\"quantity\":1},{\"productSlug\":\"eligible-product\",\"quantity\":99}],"
                + "\"addressId\":" + addressId + ",\"deliveryMethod\":\"STANDARD_DELIVERY\",\"paymentMethod\":\"CASH_ON_DELIVERY\"}";
        mockMvc.perform(post("/api/v1/orders").with(csrf()).session(owner)
                        .header("Idempotency-Key", UUID.randomUUID()).contentType("application/json").content(failing))
                .andExpect(status().isConflict());
        assertThat(products.findById(ineligible.getId()).orElseThrow().getStockQuantity()).isEqualTo(before);
    }

    private ProductEntity product(String name, String slug, String price, String discount,
                                  CategoryEntity category, BrandEntity brand, boolean eligibleDiscount, int stock) {
        ProductEntity product = ProductEntity.create(name, slug, "Checkout product", "Checkout description",
                new BigDecimal(price), discount == null ? null : new BigDecimal(discount), category, brand,
                ProductStatus.ACTIVE, false);
        product.addImage("/test/" + slug + ".png", name, 0, true);
        product.initializeAdministrationFields(slug.toUpperCase(), stock, 2, eligibleDiscount, false, true);
        return products.save(product);
    }

    private void register(String email, String phone) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register").with(csrf()).contentType("application/json")
                        .content("{\"firstName\":\"Checkout\",\"lastName\":\"Buyer\",\"phoneNumber\":\"" + phone
                                + "\",\"email\":\"" + email + "\",\"password\":\"StrongPass123\"}"))
                .andExpect(status().isCreated());
    }

    private MockHttpSession login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login").with(csrf()).contentType("application/json")
                        .content("{\"identifier\":\"" + email + "\",\"password\":\"StrongPass123\"}"))
                .andExpect(status().isOk()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private long createAddress(MockHttpSession session, String addressLine, String phone) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/account/addresses").with(csrf()).session(session)
                        .contentType("application/json").content("{\"label\":\"Home\",\"cityOrProvince\":\"Ulaanbaatar\","
                                + "\"districtOrSoum\":\"Sukhbaatar\",\"addressLine\":\"" + addressLine + "\","
                                + "\"recipientName\":\"Checkout Buyer\",\"recipientPhone\":\"" + phone + "\",\"defaultAddress\":true}"))
                .andExpect(status().isCreated()).andReturn();
        return ((Number) com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.data.id")).longValue();
    }

    private String cartJson(int eligibleQuantity, int regularQuantity) {
        return "{\"items\":[{\"productSlug\":\"eligible-product\",\"quantity\":" + eligibleQuantity
                + "},{\"productSlug\":\"regular-product\",\"quantity\":" + regularQuantity + "}]}";
    }

    private String singleCartJson(String slug, int quantity) {
        return "{\"items\":[{\"productSlug\":\"" + slug + "\",\"quantity\":" + quantity + "}]}";
    }

    private String orderJson(long addressId, int quantity, String note) {
        return "{\"items\":[{\"productSlug\":\"eligible-product\",\"quantity\":" + quantity + "}],"
                + "\"addressId\":" + addressId + ",\"deliveryMethod\":\"STANDARD_DELIVERY\","
                + "\"paymentMethod\":\"CASH_ON_DELIVERY\""
                + (note == null ? "" : ",\"customerNote\":\"" + note + "\"") + "}";
    }
}
