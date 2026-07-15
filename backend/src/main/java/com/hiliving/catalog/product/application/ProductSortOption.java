package com.hiliving.catalog.product.application;

import com.hiliving.api.error.InvalidRequestException;
import org.springframework.data.domain.Sort;

import java.util.Arrays;

public enum ProductSortOption {
    NEWEST("newest", Sort.by(
            Sort.Order.desc("createdAt"),
            Sort.Order.desc("id")
    )),
    PRICE_ASC("price_asc", Sort.by(
            Sort.Order.asc("price"),
            Sort.Order.asc("id")
    )),
    PRICE_DESC("price_desc", Sort.by(
            Sort.Order.desc("price"),
            Sort.Order.desc("id")
    )),
    NAME_ASC("name_asc", Sort.by(
            Sort.Order.asc("name").ignoreCase(),
            Sort.Order.asc("id")
    ));

    private final String apiValue;
    private final Sort sort;

    ProductSortOption(String apiValue, Sort sort) {
        this.apiValue = apiValue;
        this.sort = sort;
    }

    public Sort toSort() {
        return sort;
    }

    public static ProductSortOption fromApiValue(String value) {
        return Arrays.stream(values())
                .filter(option -> option.apiValue.equals(value))
                .findFirst()
                .orElseThrow(() -> new InvalidRequestException(
                        "sort",
                        "Allowed values are newest, price_asc, price_desc, and name_asc"
                ));
    }
}
