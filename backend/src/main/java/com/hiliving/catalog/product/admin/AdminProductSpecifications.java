package com.hiliving.catalog.product.admin;

import com.hiliving.catalog.product.persistence.*;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;
import java.util.*;

final class AdminProductSpecifications {
    private AdminProductSpecifications() {}
    static Specification<ProductEntity> filter(String search, Long categoryId, Long brandId, ProductStatus lifecycle,
                                                Boolean featured, Boolean newProduct, Boolean active,
                                                Boolean membershipEligible, InventoryState inventoryState, Boolean lowStock) {
        return (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if(search!=null&&!search.isBlank()){
                String value="%"+escape(search.trim().toLowerCase(Locale.ROOT))+"%";
                predicates.add(cb.or(cb.like(cb.lower(root.get("name")),value,'\\'),cb.like(cb.lower(root.get("slug")),value,'\\'),cb.like(cb.lower(root.get("productCode")),value,'\\')));
            }
            if(categoryId!=null) predicates.add(cb.equal(root.join("category",JoinType.INNER).get("id"),categoryId));
            if(brandId!=null) predicates.add(cb.equal(root.join("brand",JoinType.LEFT).get("id"),brandId));
            if(lifecycle!=null) predicates.add(cb.equal(root.get("status"),lifecycle));
            if(featured!=null) predicates.add(cb.equal(root.get("featured"),featured));
            if(newProduct!=null) predicates.add(cb.equal(root.get("newProduct"),newProduct));
            if(active!=null) predicates.add(cb.equal(root.get("active"),active));
            if(membershipEligible!=null) predicates.add(cb.equal(root.get("membershipDiscountEligible"),membershipEligible));
            InventoryState state = Boolean.TRUE.equals(lowStock) ? InventoryState.LOW_STOCK : inventoryState;
            if(state==InventoryState.OUT_OF_STOCK) predicates.add(cb.equal(root.get("stockQuantity"),0));
            else if(state==InventoryState.LOW_STOCK) predicates.add(cb.and(cb.greaterThan(root.get("stockQuantity"),0),cb.lessThanOrEqualTo(root.get("stockQuantity"),root.get("lowStockThreshold"))));
            else if(state==InventoryState.IN_STOCK) predicates.add(cb.greaterThan(root.get("stockQuantity"),root.get("lowStockThreshold")));
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }
    private static String escape(String s){return s.replace("\\","\\\\").replace("%","\\%").replace("_","\\_");}
}
