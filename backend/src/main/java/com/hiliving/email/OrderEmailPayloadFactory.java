package com.hiliving.email;

import com.hiliving.commerce.order.OrderAddressSnapshotEntity;
import com.hiliving.commerce.order.OrderEntity;
import org.springframework.stereotype.Component;

@Component
public class OrderEmailPayloadFactory {
    public EmailPayloads.Order from(OrderEntity order) {
        OrderAddressSnapshotEntity address = order.getAddressSnapshot();
        return new EmailPayloads.Order(
                order.getCustomerFirstNameSnapshot(), order.getOrderNumber(), order.getPlacedAt(),
                order.getOrderStatus().name(), order.getCurrency(), order.getRegularSubtotal(),
                order.getDiscountTotal(), order.getShippingTotal(), order.getGrandTotal(),
                order.getItems().stream().map(item -> new EmailPayloads.OrderItem(
                        item.getProductNameSnapshot(), item.getSkuSnapshot(), item.getUnitRegularPrice(),
                        item.getUnitEffectivePrice(), item.getDiscountPerUnit(), item.getQuantity(), item.getLineTotal()
                )).toList(),
                new EmailPayloads.OrderAddress(
                        address.getLabel(), address.getCityOrProvince(), address.getDistrictOrSoum(),
                        address.getKhorooOrBag(), address.getAddressLine(), address.getAdditionalDetails(),
                        address.getRecipientName(), address.getRecipientPhone()
                )
        );
    }
}
