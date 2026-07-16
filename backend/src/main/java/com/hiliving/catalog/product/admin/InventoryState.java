package com.hiliving.catalog.product.admin;

public enum InventoryState { OUT_OF_STOCK, LOW_STOCK, IN_STOCK;
    public static InventoryState of(int stock, int threshold) {
        if (stock == 0) return OUT_OF_STOCK;
        return stock <= threshold ? LOW_STOCK : IN_STOCK;
    }
}
