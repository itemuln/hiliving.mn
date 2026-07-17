package com.hiliving.commerce.order;

import com.hiliving.catalog.product.persistence.ProductEntity;
import com.hiliving.commerce.cart.CartLineResponse;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItemEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id", nullable = false)
    private OrderEntity order;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;
    @Column(name = "product_slug_snapshot", nullable = false, length = 260)
    private String productSlugSnapshot;
    @Column(name = "sku_snapshot", nullable = false, length = 80)
    private String skuSnapshot;
    @Column(name = "product_name_snapshot", nullable = false, length = 240)
    private String productNameSnapshot;
    @Column(name = "primary_image_url_snapshot", length = 2048)
    private String primaryImageUrlSnapshot;
    @Column(name = "unit_regular_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitRegularPrice;
    @Column(name = "unit_effective_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitEffectivePrice;
    @Column(name = "discount_per_unit", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountPerUnit;
    @Column(nullable = false)
    private int quantity;
    @Column(name = "line_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal lineTotal;

    protected OrderItemEntity() {}

    static OrderItemEntity snapshot(OrderEntity order, ProductEntity product, CartLineResponse line) {
        OrderItemEntity item = new OrderItemEntity();
        item.order = order;
        item.product = product;
        item.productSlugSnapshot = line.productSlug();
        item.skuSnapshot = line.sku();
        item.productNameSnapshot = line.productName();
        item.primaryImageUrlSnapshot = line.primaryImageUrl();
        item.unitRegularPrice = line.unitRegularPrice();
        item.unitEffectivePrice = line.unitEffectivePrice();
        item.discountPerUnit = line.discountAmount();
        item.quantity = line.requestedQuantity();
        item.lineTotal = line.lineSubtotal();
        return item;
    }

    public Long getId() { return id; }
    public String getProductSlugSnapshot() { return productSlugSnapshot; }
    public String getSkuSnapshot() { return skuSnapshot; }
    public String getProductNameSnapshot() { return productNameSnapshot; }
    public String getPrimaryImageUrlSnapshot() { return primaryImageUrlSnapshot; }
    public BigDecimal getUnitRegularPrice() { return unitRegularPrice; }
    public BigDecimal getUnitEffectivePrice() { return unitEffectivePrice; }
    public BigDecimal getDiscountPerUnit() { return discountPerUnit; }
    public int getQuantity() { return quantity; }
    public BigDecimal getLineTotal() { return lineTotal; }
}
