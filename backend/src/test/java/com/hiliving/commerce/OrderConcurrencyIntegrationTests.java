package com.hiliving.commerce;

import com.hiliving.TestcontainersConfiguration;
import com.hiliving.api.error.ApiRequestException;
import com.hiliving.catalog.CatalogTestFixtures;
import com.hiliving.catalog.brand.persistence.BrandRepository;
import com.hiliving.catalog.category.persistence.CategoryRepository;
import com.hiliving.catalog.product.persistence.ProductEntity;
import com.hiliving.catalog.product.persistence.ProductRepository;
import com.hiliving.catalog.product.persistence.ProductStatus;
import com.hiliving.commerce.cart.CartItemRequest;
import com.hiliving.commerce.order.OrderRepository;
import com.hiliving.commerce.order.OrderService;
import com.hiliving.commerce.order.PlaceOrderRequest;
import com.hiliving.identity.user.persistence.MembershipTierRepository;
import com.hiliving.identity.user.persistence.UserAddressEntity;
import com.hiliving.identity.user.persistence.UserAddressRepository;
import com.hiliving.identity.user.persistence.UserEntity;
import com.hiliving.identity.user.persistence.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfiguration.class)
@SpringBootTest(properties = "hiliving.checkout.standard-shipping-fee=0.00")
class OrderConcurrencyIntegrationTests {
    @Autowired OrderService orderService;
    @Autowired OrderRepository orders;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired BrandRepository brands;
    @Autowired UserRepository users;
    @Autowired UserAddressRepository addresses;
    @Autowired MembershipTierRepository memberships;

    @AfterEach
    void cleanUp() {
        orders.deleteAll();
        addresses.deleteAll();
        users.deleteAll();
        products.deleteAll();
        brands.deleteAll();
        categories.deleteAll();
    }

    @Test
    void concurrentPurchasesForLastUnitCreateOneOrderAndNeverNegativeInventory() throws Exception {
        var category = categories.save(CatalogTestFixtures.category("Race", "race", true));
        var brand = brands.save(CatalogTestFixtures.brand("Race Brand", "race-brand", true));
        ProductEntity product = ProductEntity.create("Last unit", "last-unit", "Race", "Race test",
                new BigDecimal("1000.00"), null, category, brand, ProductStatus.ACTIVE, false);
        product.addImage("/test/last-unit.png", "Last unit", 0, true);
        product.initializeAdministrationFields("LAST-UNIT", 1, 1, true, false, true);
        product = products.saveAndFlush(product);

        var regular = memberships.findByCodeAndActiveTrue("REGULAR").orElseThrow();
        UserEntity first = users.save(UserEntity.customer("First", "Buyer", "race-first@example.com", "+97699113301", "{noop}password", regular));
        UserEntity second = users.save(UserEntity.customer("Second", "Buyer", "race-second@example.com", "+97699113302", "{noop}password", regular));
        UserAddressEntity firstAddress = address(first, "+97699113301");
        UserAddressEntity secondAddress = address(second, "+97699113302");

        PlaceOrderRequest firstRequest = request(firstAddress.getId());
        PlaceOrderRequest secondRequest = request(secondAddress.getId());
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Future<Object> firstResult = executor.submit(() -> placeAfter(start, first.getId(), firstRequest));
            Future<Object> secondResult = executor.submit(() -> placeAfter(start, second.getId(), secondRequest));
            start.countDown();
            List<Object> results = List.of(firstResult.get(), secondResult.get());
            assertThat(results.stream().filter(result -> !(result instanceof ApiRequestException)).count()).isEqualTo(1);
            assertThat(results.stream().filter(ApiRequestException.class::isInstance).count()).isEqualTo(1);
        }

        assertThat(orders.count()).isEqualTo(1);
        assertThat(products.findById(product.getId()).orElseThrow().getStockQuantity()).isZero();
    }

    private Object placeAfter(CountDownLatch start, Long customerId, PlaceOrderRequest request) throws InterruptedException {
        start.await();
        try {
            return orderService.place(customerId, UUID.randomUUID().toString(), request);
        } catch (ApiRequestException exception) {
            return exception;
        }
    }

    private UserAddressEntity address(UserEntity user, String phone) {
        UserAddressEntity address = UserAddressEntity.create(user);
        address.update("Home", "Ulaanbaatar", "Sukhbaatar", "1", "Peace Avenue",
                null, user.getFirstName() + " " + user.getLastName(), phone, true);
        return addresses.saveAndFlush(address);
    }

    private PlaceOrderRequest request(Long addressId) {
        return new PlaceOrderRequest(List.of(new CartItemRequest("last-unit", 1)), addressId,
                "STANDARD_DELIVERY", "CASH_ON_DELIVERY", null);
    }
}
