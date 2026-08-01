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
import com.hiliving.commerce.order.OrderStatus;
import com.hiliving.commerce.order.PaymentStatus;
import com.hiliving.commerce.payment.PaymentAttemptRepository;
import com.hiliving.commerce.payment.PaymentAttemptStatus;
import com.hiliving.commerce.payment.PaymentStateService;
import com.hiliving.commerce.payment.QpayClient;
import com.hiliving.commerce.payment.QpayProviderException;
import com.hiliving.email.EmailEventType;
import com.hiliving.email.outbox.EmailOutboxRepository;
import com.hiliving.identity.user.persistence.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
    @Autowired PaymentAttemptRepository paymentAttempts;
    @Autowired PaymentStateService paymentState;
    @Autowired EmailOutboxRepository emailOutbox;
    @MockitoBean QpayClient qpay;

    private ProductEntity eligible;
    private ProductEntity ineligible;

    @BeforeEach
    void setUp() {
        when(qpay.configured()).thenReturn(true);
        when(qpay.invoiceTtl()).thenReturn(Duration.ofMinutes(15));
        when(qpay.callbackBaseUrl()).thenReturn("https://shop.example");
        when(qpay.invoiceCode()).thenReturn("TEST_INVOICE");
        CategoryEntity category = categories.save(CatalogTestFixtures.category("Checkout", "checkout", true));
        BrandEntity brand = brands.save(CatalogTestFixtures.brand("Checkout Brand", "checkout-brand", true));
        eligible = product("Eligible", "eligible-product", "10000.00", "9000.00", category, brand, true, 5);
        ineligible = product("Regular", "regular-product", "20000.00", null, category, brand, false, 3);
    }

    @Test
    void qpayCheckoutCreatesInstructionsAndVerifiedCallbackConfirmsTheOrder() throws Exception {
        register("qpay-buyer@example.com", "99112300");
        MockHttpSession buyer = login("qpay-buyer@example.com");
        long addressId = createAddress(buyer, "QPay address", "99112301");
        when(qpay.createInvoice(any())).thenReturn(new QpayClient.InvoiceResponse(
                "qpay-invoice-1", "000201-qpay", "cXItcG5n", "https://s.qpay.mn/test",
                List.of(new QpayClient.Deeplink(
                        "Khan bank", "Хаан банк", "https://qpay.mn/q/logo/khanbank.png",
                        "khanbank://q?qPay_QRcode=000201-qpay"
                ))
        ));
        when(qpay.checkPayment("qpay-invoice-1")).thenReturn(new QpayClient.PaymentCheckResponse(
                1, new BigDecimal("14000.00"), List.of(new QpayClient.PaymentRow(
                        "qpay-payment-1", "PAID", new BigDecimal("14000.00"), "MNT"
                ))
        ));

        MvcResult placed = mockMvc.perform(post("/api/v1/orders").with(csrf()).session(buyer)
                        .header("Idempotency-Key", UUID.randomUUID()).contentType("application/json")
                        .content(qpayOrderJson(addressId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.order.orderStatus").value("PENDING_PAYMENT"))
                .andExpect(jsonPath("$.data.order.paymentStatus").value("PENDING"))
                .andExpect(jsonPath("$.data.payment.status").value("AWAITING_PAYMENT"))
                .andExpect(jsonPath("$.data.payment.qrImageDataUrl").value("data:image/png;base64,cXItcG5n"))
                .andExpect(jsonPath("$.data.payment.deeplinks[0].name").value("Khan bank"))
                .andReturn();
        String orderNumber = com.jayway.jsonpath.JsonPath.read(
                placed.getResponse().getContentAsString(), "$.data.order.orderNumber");

        assertThat(emailOutbox.findAll().stream()
                .filter(email -> email.getEventType() == EmailEventType.ORDER_CONFIRMATION)).isEmpty();
        mockMvc.perform(get("/api/v1/orders").session(buyer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].orderNumber").value(orderNumber))
                .andExpect(jsonPath("$.data.items[0].orderStatus").value("PENDING_PAYMENT"));

        ArgumentCaptor<QpayClient.InvoiceRequest> invoiceRequest =
                ArgumentCaptor.forClass(QpayClient.InvoiceRequest.class);
        verify(qpay).createInvoice(invoiceRequest.capture());
        assertThat(invoiceRequest.getValue().enableExpiry()).isFalse();
        String callbackPath = URI.create(invoiceRequest.getValue().callbackUrl()).getPath();
        mockMvc.perform(get(callbackPath).param("qpay_payment_id", "qpay-payment-1"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/orders/{orderNumber}", orderNumber).session(buyer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderStatus").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.paymentStatus").value("PAID"));
        register("qpay-admin@example.com", "99112302");
        var admin = users.findByEmail("qpay-admin@example.com").orElseThrow();
        org.springframework.test.util.ReflectionTestUtils.setField(
                admin, "role", com.hiliving.identity.user.persistence.UserRole.ADMIN);
        users.saveAndFlush(admin);
        MockHttpSession adminSession = login("qpay-admin@example.com");
        mockMvc.perform(get("/api/v1/admin/orders").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].orderNumber").value(orderNumber))
                .andExpect(jsonPath("$.data.items[0].orderStatus").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.items[0].paymentStatus").value("PAID"));
        assertThat(emailOutbox.findAll().stream()
                .filter(email -> email.getEventType() == EmailEventType.ORDER_CONFIRMATION)).hasSize(1);
    }

    @Test
    void qpayAmountMismatchPersistsAnExplicitReconciliationState() throws Exception {
        register("qpay-mismatch@example.com", "99112310");
        MockHttpSession buyer = login("qpay-mismatch@example.com");
        long addressId = createAddress(buyer, "Mismatch address", "99112311");
        when(qpay.createInvoice(any())).thenReturn(new QpayClient.InvoiceResponse(
                "qpay-invoice-mismatch", "000201-qpay", "cXItcG5n", "https://s.qpay.mn/test",
                List.of(new QpayClient.Deeplink(
                        "Khan bank", "Хаан банк", "https://qpay.mn/q/logo/khanbank.png",
                        "khanbank://q?qPay_QRcode=000201-qpay"
                ))
        ));
        when(qpay.checkPayment("qpay-invoice-mismatch")).thenReturn(new QpayClient.PaymentCheckResponse(
                1, new BigDecimal("1.00"), List.of(new QpayClient.PaymentRow(
                        "qpay-payment-mismatch", "PAID", new BigDecimal("1.00"), "MNT"
                ))
        ));

        MvcResult placed = mockMvc.perform(post("/api/v1/orders").with(csrf()).session(buyer)
                        .header("Idempotency-Key", UUID.randomUUID()).contentType("application/json")
                        .content(qpayOrderJson(addressId)))
                .andExpect(status().isCreated()).andReturn();
        String orderNumber = com.jayway.jsonpath.JsonPath.read(
                placed.getResponse().getContentAsString(), "$.data.order.orderNumber");

        mockMvc.perform(post("/api/v1/orders/{orderNumber}/payment/check", orderNumber)
                        .with(csrf()).session(buyer))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("PAYMENT_RECONCILIATION_REQUIRED"));
        mockMvc.perform(get("/api/v1/orders/{orderNumber}/payment", orderNumber).session(buyer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RECONCILIATION_REQUIRED"));
    }

    @Test
    void qpayInvoiceFailureCancelsOrderAndRestoresInventoryExactlyOnce() throws Exception {
        register("qpay-failure@example.com", "99112320");
        MockHttpSession buyer = login("qpay-failure@example.com");
        long addressId = createAddress(buyer, "Failure address", "99112321");
        when(qpay.createInvoice(any())).thenThrow(
                new QpayProviderException("QPAY_AUTH_UNAVAILABLE", "QPay authentication failed")
        );

        mockMvc.perform(post("/api/v1/orders").with(csrf()).session(buyer)
                        .header("Idempotency-Key", UUID.randomUUID()).contentType("application/json")
                        .content(qpayOrderJson(addressId)))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error.code").value("QPAY_AUTH_UNAVAILABLE"));

        var failedOrder = orders.findAll().getFirst();
        var failedAttempt = paymentAttempts.findFirstByOrderIdOrderByAttemptNumberDesc(failedOrder.getId())
                .orElseThrow();
        assertThat(failedOrder.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(failedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(failedOrder.getInventoryReleasedAt()).isNotNull();
        assertThat(failedAttempt.getStatus()).isEqualTo(PaymentAttemptStatus.FAILED);
        assertThat(failedAttempt.getFailureCode()).isEqualTo("QPAY_AUTH_UNAVAILABLE");
        assertThat(products.findById(eligible.getId()).orElseThrow().getStockQuantity()).isEqualTo(5);

        paymentState.recordFailure(failedAttempt.getId(), "QPAY_AUTH_UNAVAILABLE");

        assertThat(products.findById(eligible.getId()).orElseThrow().getStockQuantity()).isEqualTo(5);
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
                        .content("{\"items\":[],\"deliveryMethod\":\"STANDARD_DELIVERY\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
        mockMvc.perform(post("/api/v1/cart/quote").with(csrf()).contentType("application/json")
                        .content("{\"items\":[{\"productSlug\":\"missing\",\"quantity\":1}],"
                                + "\"deliveryMethod\":\"STANDARD_DELIVERY\"}"))
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
    void selfPickupHasNoShippingFeeAndSnapshotsTheSamplePickupLocation() throws Exception {
        String pickupCart = "{\"items\":[{\"productSlug\":\"eligible-product\",\"quantity\":1}],"
                + "\"deliveryMethod\":\"SELF_PICKUP\"}";
        mockMvc.perform(post("/api/v1/cart/quote").with(csrf()).contentType("application/json")
                        .content(pickupCart))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.effectiveSubtotal").value(9000.0))
                .andExpect(jsonPath("$.data.shippingAmount").value(0.0))
                .andExpect(jsonPath("$.data.grandTotal").value(9000.0));

        register("pickup-buyer@example.com", "99112211");
        MockHttpSession buyer = login("pickup-buyer@example.com");
        long addressId = createAddress(buyer, "Must not be used", "99112212");
        String pickupOrder = "{\"items\":[{\"productSlug\":\"eligible-product\",\"quantity\":1}],"
                + "\"addressId\":null,\"deliveryMethod\":\"SELF_PICKUP\","
                + "\"paymentMethod\":\"CASH_ON_DELIVERY\"}";

        mockMvc.perform(post("/api/v1/orders").with(csrf()).session(buyer)
                        .header("Idempotency-Key", UUID.randomUUID()).contentType("application/json")
                        .content(pickupOrder))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.order.deliveryMethod").value("SELF_PICKUP"))
                .andExpect(jsonPath("$.data.order.shippingTotal").value(0.0))
                .andExpect(jsonPath("$.data.order.grandTotal").value(9000.0))
                .andExpect(jsonPath("$.data.order.address.label").value("Өөрөө авах — туршилтын байршил"))
                .andExpect(jsonPath("$.data.order.address.addressLine")
                        .value("Зайсангийн гүүрний урд, Hiliving Mongolia төв оффис"))
                .andExpect(jsonPath("$.data.order.address.additionalDetails").value(
                        "Даваа–Бямба 10:00–20:00 · Ням амарна · Утас: 7755-8888"));

        mockMvc.perform(post("/api/v1/orders").with(csrf()).session(buyer)
                        .header("Idempotency-Key", UUID.randomUUID()).contentType("application/json")
                        .content("{\"items\":[{\"productSlug\":\"regular-product\",\"quantity\":1}],"
                                + "\"addressId\":null,\"deliveryMethod\":\"STANDARD_DELIVERY\","
                                + "\"paymentMethod\":\"CASH_ON_DELIVERY\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("DELIVERY_ADDRESS_REQUIRED"));

        mockMvc.perform(post("/api/v1/orders").with(csrf()).session(buyer)
                        .header("Idempotency-Key", UUID.randomUUID()).contentType("application/json")
                        .content("{\"items\":[{\"productSlug\":\"regular-product\",\"quantity\":1}],"
                                + "\"addressId\":" + addressId + ",\"deliveryMethod\":\"SELF_PICKUP\","
                                + "\"paymentMethod\":\"CASH_ON_DELIVERY\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("PICKUP_ADDRESS_NOT_ALLOWED"));
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
                .andExpect(jsonPath("$.data.order.orderStatus").value("PENDING_CONFIRMATION"))
                .andExpect(jsonPath("$.data.order.paymentStatus").value("UNPAID"))
                .andExpect(jsonPath("$.data.order.paymentMethod").value("CASH_ON_DELIVERY"))
                .andExpect(jsonPath("$.data.order.items[0].productName").value("Eligible"))
                .andExpect(jsonPath("$.data.order.items[0].unitEffectivePrice").value(8100.0))
                .andExpect(jsonPath("$.data.order.address.addressLine").value("Original address"))
                .andReturn();
        String orderNumber = com.jayway.jsonpath.JsonPath.read(placed.getResponse().getContentAsString(), "$.data.order.orderNumber");

        assertThat(products.findById(eligible.getId()).orElseThrow().getStockQuantity()).isEqualTo(3);
        assertThat(orders.count()).isEqualTo(1);
        var confirmation = emailOutbox.findAll().stream()
                .filter(email -> email.getEventType() == EmailEventType.ORDER_CONFIRMATION).toList();
        assertThat(confirmation).hasSize(1);
        assertThat(confirmation.getFirst().getRecipient()).isEqualTo("buyer@example.com");
        assertThat(confirmation.getFirst().getPayload())
                .contains("Eligible", "Original address", "8100.00", orderNumber)
                .doesNotContain("passwordHash");
        mockMvc.perform(post("/api/v1/orders").with(csrf()).session(buyer)
                        .header("Idempotency-Key", key).contentType("application/json").content(orderBody))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.order.orderNumber").value(orderNumber));
        assertThat(orders.count()).isEqualTo(1);
        assertThat(emailOutbox.findAll().stream()
                .filter(email -> email.getEventType() == EmailEventType.ORDER_CONFIRMATION).toList()).hasSize(1);
        assertThat(products.findById(eligible.getId()).orElseThrow().getStockQuantity()).isEqualTo(3);

        mockMvc.perform(get("/api/v1/orders/{orderNumber}", orderNumber).session(buyer))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.customerNote").value("Door code 12"));

        register("order-admin@example.com", "99112209");
        var admin = users.findByEmail("order-admin@example.com").orElseThrow();
        org.springframework.test.util.ReflectionTestUtils.setField(
                admin, "role", com.hiliving.identity.user.persistence.UserRole.ADMIN);
        users.saveAndFlush(admin);
        MockHttpSession adminSession = login("order-admin@example.com");
        for (int attempt = 0; attempt < 2; attempt++) {
            mockMvc.perform(patch("/api/v1/admin/orders/{orderNumber}/status", orderNumber)
                            .with(csrf()).session(adminSession).contentType("application/json")
                            .content("{\"status\":\"CONFIRMED\"}"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data.orderStatus").value("CONFIRMED"));
        }
        assertThat(emailOutbox.findAll().stream()
                .filter(email -> email.getEventType() == EmailEventType.ORDER_STATUS_CHANGED).toList()).hasSize(1);
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
                .andExpect(jsonPath("$.data.order.grandTotal").value(14000.0))
                .andExpect(jsonPath("$.data.order.orderStatus").value("PENDING_CONFIRMATION"))
                .andExpect(jsonPath("$.data.order.paymentStatus").value("UNPAID"))
                .andReturn();
        String orderNumber = com.jayway.jsonpath.JsonPath.read(placed.getResponse().getContentAsString(), "$.data.order.orderNumber");
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
        product.addImage("/test/" + slug + ".png", name, 0, true, 100);
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
                + "},{\"productSlug\":\"regular-product\",\"quantity\":" + regularQuantity + "}],"
                + "\"deliveryMethod\":\"STANDARD_DELIVERY\"}";
    }

    private String singleCartJson(String slug, int quantity) {
        return "{\"items\":[{\"productSlug\":\"" + slug + "\",\"quantity\":" + quantity + "}],"
                + "\"deliveryMethod\":\"STANDARD_DELIVERY\"}";
    }

    private String orderJson(long addressId, int quantity, String note) {
        return "{\"items\":[{\"productSlug\":\"eligible-product\",\"quantity\":" + quantity + "}],"
                + "\"addressId\":" + addressId + ",\"deliveryMethod\":\"STANDARD_DELIVERY\","
                + "\"paymentMethod\":\"CASH_ON_DELIVERY\""
                + (note == null ? "" : ",\"customerNote\":\"" + note + "\"") + "}";
    }

    private String qpayOrderJson(long addressId) {
        return "{\"items\":[{\"productSlug\":\"eligible-product\",\"quantity\":1}],"
                + "\"addressId\":" + addressId + ",\"deliveryMethod\":\"STANDARD_DELIVERY\","
                + "\"paymentMethod\":\"QPAY\"}";
    }
}
