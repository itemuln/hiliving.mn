package com.hiliving.commerce.pricing;

import com.hiliving.api.error.ApiRequestException;
import com.hiliving.catalog.product.persistence.ProductEntity;
import com.hiliving.catalog.product.persistence.ProductImageEntity;
import com.hiliving.catalog.product.persistence.ProductRepository;
import com.hiliving.catalog.product.persistence.ProductStatus;
import com.hiliving.commerce.cart.CartItemRequest;
import com.hiliving.commerce.cart.CartLineResponse;
import com.hiliving.commerce.cart.CartQuoteResponse;
import com.hiliving.identity.user.persistence.UserEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@Service
public class PricingService {

    public static final String CURRENCY = "MNT";
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private final ProductRepository products;
    private final BigDecimal standardShippingFee;

    public PricingService(
            ProductRepository products,
            @Value("${hiliving.checkout.standard-shipping-fee:5000.00}") BigDecimal standardShippingFee
    ) {
        this.products = products;
        this.standardShippingFee = money(standardShippingFee.max(BigDecimal.ZERO));
    }

    @Transactional(readOnly = true)
    public CartQuoteResponse quote(List<CartItemRequest> requestedItems, UserEntity customer) {
        if (requestedItems == null || requestedItems.isEmpty()) {
            throw error(HttpStatus.BAD_REQUEST, "CART_EMPTY", "Cart must contain at least one item");
        }
        if (requestedItems.size() > 50) {
            throw error(HttpStatus.BAD_REQUEST, "CART_TOO_LARGE", "Cart contains too many items");
        }
        HashSet<String> uniqueSlugs = new HashSet<>();
        for (CartItemRequest item : requestedItems) {
            if (!uniqueSlugs.add(item.productSlug())) {
                throw error(HttpStatus.BAD_REQUEST, "DUPLICATE_CART_ITEM", "Cart contains a duplicate product");
            }
        }

        Map<String, ProductEntity> productBySlug = new HashMap<>();
        products.findAllWithDetailsBySlugIn(uniqueSlugs).forEach(product -> productBySlug.put(product.getSlug(), product));

        BigDecimal membershipPercentage = customer == null
                ? BigDecimal.ZERO
                : customer.effectiveDiscountPercentage().max(BigDecimal.ZERO).min(ONE_HUNDRED);
        List<CartLineResponse> lines = new ArrayList<>();
        BigDecimal regularSubtotal = BigDecimal.ZERO;
        BigDecimal catalogDiscountTotal = BigDecimal.ZERO;
        BigDecimal membershipDiscountTotal = BigDecimal.ZERO;

        for (CartItemRequest item : requestedItems) {
            ProductEntity product = productBySlug.get(item.productSlug());
            validatePurchasable(product, item.quantity());
            PricedProduct priced = price(product, membershipPercentage);
            BigDecimal quantity = BigDecimal.valueOf(item.quantity());
            BigDecimal lineRegular = money(priced.regularPrice().multiply(quantity));
            BigDecimal lineCatalogDiscount = money(priced.regularPrice().subtract(priced.catalogPrice()).multiply(quantity));
            BigDecimal lineMembershipDiscount = money(priced.catalogPrice().subtract(priced.effectivePrice()).multiply(quantity));
            BigDecimal lineTotal = money(priced.effectivePrice().multiply(quantity));

            regularSubtotal = regularSubtotal.add(lineRegular);
            catalogDiscountTotal = catalogDiscountTotal.add(lineCatalogDiscount);
            membershipDiscountTotal = membershipDiscountTotal.add(lineMembershipDiscount);
            lines.add(new CartLineResponse(
                    product.getId(), product.getSlug(), product.getName(), product.getProductCode(), primaryImage(product),
                    item.quantity(), product.getStockQuantity(), priced.regularPrice(), priced.catalogPrice(),
                    priced.effectivePrice(), priced.membershipPercentage(),
                    money(priced.regularPrice().subtract(priced.effectivePrice())), lineTotal,
                    product.isMembershipDiscountEligible(), inventoryStatus(product), List.of()
            ));
        }

        BigDecimal regular = money(regularSubtotal);
        BigDecimal catalogDiscount = money(catalogDiscountTotal);
        BigDecimal membershipDiscount = money(membershipDiscountTotal);
        BigDecimal discountTotal = money(catalogDiscount.add(membershipDiscount));
        BigDecimal effectiveSubtotal = money(regular.subtract(discountTotal));
        BigDecimal shipping = standardShippingFee;
        return new CartQuoteResponse(
                List.copyOf(lines), regular, catalogDiscount, membershipDiscount, discountTotal,
                effectiveSubtotal, shipping, money(effectiveSubtotal.add(shipping)), CURRENCY, true
        );
    }

    public PricedProduct price(ProductEntity product, BigDecimal membershipPercentage) {
        BigDecimal regular = money(product.getPrice());
        BigDecimal catalog = product.getDiscountPrice() == null
                ? regular
                : money(product.getDiscountPrice().min(regular));
        BigDecimal applicablePercentage = product.isMembershipDiscountEligible()
                ? membershipPercentage.max(BigDecimal.ZERO).min(ONE_HUNDRED)
                : BigDecimal.ZERO;
        BigDecimal membershipDiscount = money(catalog.multiply(applicablePercentage).divide(ONE_HUNDRED, 4, RoundingMode.HALF_UP));
        return new PricedProduct(regular, catalog, money(catalog.subtract(membershipDiscount)), money(applicablePercentage));
    }

    public void validatePurchasable(ProductEntity product, int quantity) {
        if (product == null) {
            throw error(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "A cart product was not found");
        }
        if (product.getStatus() != ProductStatus.ACTIVE || !product.isActive()
                || !product.getCategory().isActive()
                || (product.getBrand() != null && !product.getBrand().isActive())) {
            throw error(HttpStatus.CONFLICT, "PRODUCT_NOT_AVAILABLE", "A cart product is not available");
        }
        if (quantity < 1 || quantity > 99) {
            throw error(HttpStatus.BAD_REQUEST, "INVALID_QUANTITY", "Quantity must be between 1 and 99");
        }
        if (product.getStockQuantity() == 0) {
            throw error(HttpStatus.CONFLICT, "OUT_OF_STOCK", "A cart product is out of stock");
        }
        if (quantity > product.getStockQuantity()) {
            throw error(HttpStatus.CONFLICT, "QUANTITY_EXCEEDS_STOCK", "Requested quantity exceeds available stock");
        }
    }

    private String primaryImage(ProductEntity product) {
        return product.getImages().stream()
                .sorted(Comparator.comparing(ProductImageEntity::isPrimaryImage).reversed()
                        .thenComparingInt(ProductImageEntity::getDisplayOrder)
                        .thenComparing(ProductImageEntity::getId))
                .map(ProductImageEntity::getImageUrl)
                .findFirst().orElse(null);
    }

    private String inventoryStatus(ProductEntity product) {
        return product.getStockQuantity() <= product.getLowStockThreshold() ? "LOW_STOCK" : "IN_STOCK";
    }

    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private ApiRequestException error(HttpStatus status, String code, String message) {
        return new ApiRequestException(status, code, message);
    }

    public record PricedProduct(
            BigDecimal regularPrice,
            BigDecimal catalogPrice,
            BigDecimal effectivePrice,
            BigDecimal membershipPercentage
    ) {
    }
}
