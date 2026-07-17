package com.hiliving.commerce.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        String orderNumber,
        Instant placedAt,
        String orderStatus,
        String paymentStatus,
        String paymentMethod,
        String deliveryMethod,
        String currency,
        BigDecimal regularSubtotal,
        BigDecimal discountTotal,
        BigDecimal effectiveSubtotal,
        BigDecimal shippingTotal,
        BigDecimal grandTotal,
        String customerNote,
        List<Item> items,
        Address address
) {
    public record Item(String productSlug, String sku, String productName, String primaryImageUrl,
                       BigDecimal unitRegularPrice, BigDecimal unitEffectivePrice,
                       BigDecimal discountPerUnit, int quantity, BigDecimal lineTotal) {}
    public record Address(String label, String cityOrProvince, String districtOrSoum, String khorooOrBag,
                          String addressLine, String additionalDetails, String recipientName, String recipientPhone) {}

    public static OrderResponse from(OrderEntity order) {
        OrderAddressSnapshotEntity address = order.getAddressSnapshot();
        return new OrderResponse(
                order.getOrderNumber(), order.getPlacedAt(), order.getOrderStatus().name(),
                order.getPaymentStatus().name(), order.getPaymentMethod().name(), order.getDeliveryMethod().name(),
                order.getCurrency(), order.getRegularSubtotal(), order.getDiscountTotal(), order.getEffectiveSubtotal(),
                order.getShippingTotal(), order.getGrandTotal(), order.getCustomerNote(),
                order.getItems().stream().map(item -> new Item(
                        item.getProductSlugSnapshot(), item.getSkuSnapshot(), item.getProductNameSnapshot(),
                        item.getPrimaryImageUrlSnapshot(), item.getUnitRegularPrice(), item.getUnitEffectivePrice(),
                        item.getDiscountPerUnit(), item.getQuantity(), item.getLineTotal())).toList(),
                new Address(address.getLabel(), address.getCityOrProvince(), address.getDistrictOrSoum(),
                        address.getKhorooOrBag(), address.getAddressLine(), address.getAdditionalDetails(),
                        address.getRecipientName(), address.getRecipientPhone())
        );
    }
}
