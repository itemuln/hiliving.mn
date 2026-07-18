package com.hiliving.catalog.product.admin;

import com.hiliving.catalog.product.persistence.ProductRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;

@Component
final class ProductIdentifierGenerator {

    private static final int MAX_SLUG_LENGTH = 260;

    private final ProductRepository products;
    private final JdbcTemplate jdbcTemplate;

    ProductIdentifierGenerator(ProductRepository products, JdbcTemplate jdbcTemplate) {
        this.products = products;
        this.jdbcTemplate = jdbcTemplate;
    }

    String uniqueSlug(String productName) {
        String base = slugify(productName);
        jdbcTemplate.queryForObject(
                "select 1 from (select pg_advisory_xact_lock(hashtextextended(?, 0))) locked",
                Integer.class,
                base
        );

        String candidate = base;
        int suffix = 2;
        while (products.existsBySlug(candidate)) {
            candidate = withSuffix(base, suffix++);
        }
        return candidate;
    }

    String nextProductCode() {
        Long value = jdbcTemplate.queryForObject(
                "select nextval('product_code_sequence')",
                Long.class
        );
        if (value == null) {
            throw new IllegalStateException("Product code sequence returned no value");
        }
        return "PRD-%06d".formatted(value);
    }

    private String slugify(String value) {
        String transliterated = transliterateMongolianCyrillic(value.trim().toLowerCase(Locale.ROOT));
        String normalized = Normalizer.normalize(transliterated, Normalizer.Form.NFKD)
                .replaceAll("\\p{M}+", "")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        String base = normalized.isBlank() ? "product" : normalized;
        return trimTrailingHyphens(base.substring(0, Math.min(base.length(), MAX_SLUG_LENGTH)));
    }

    private String withSuffix(String base, int number) {
        String suffix = "-" + number;
        int baseLimit = MAX_SLUG_LENGTH - suffix.length();
        String shortened = trimTrailingHyphens(base.substring(0, Math.min(base.length(), baseLimit)));
        return shortened + suffix;
    }

    private String trimTrailingHyphens(String value) {
        return value.replaceAll("-+$", "");
    }

    private String transliterateMongolianCyrillic(String value) {
        StringBuilder result = new StringBuilder(value.length());
        value.codePoints().forEach(codePoint -> result.append(switch (codePoint) {
            case 'а' -> "a";
            case 'б' -> "b";
            case 'в' -> "v";
            case 'г' -> "g";
            case 'д' -> "d";
            case 'е' -> "e";
            case 'ё' -> "yo";
            case 'ж' -> "zh";
            case 'з' -> "z";
            case 'и', 'й' -> "i";
            case 'к' -> "k";
            case 'л' -> "l";
            case 'м' -> "m";
            case 'н' -> "n";
            case 'о', 'ө' -> "o";
            case 'п' -> "p";
            case 'р' -> "r";
            case 'с' -> "s";
            case 'т' -> "t";
            case 'у', 'ү' -> "u";
            case 'ф' -> "f";
            case 'х' -> "kh";
            case 'ц' -> "ts";
            case 'ч' -> "ch";
            case 'ш' -> "sh";
            case 'щ' -> "shch";
            case 'ы' -> "y";
            case 'э' -> "e";
            case 'ю' -> "yu";
            case 'я' -> "ya";
            case 'ъ', 'ь' -> "";
            default -> new String(Character.toChars(codePoint));
        }));
        return result.toString();
    }
}
