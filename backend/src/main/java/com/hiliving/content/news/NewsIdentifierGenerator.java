package com.hiliving.content.news;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;

@Component
final class NewsIdentifierGenerator {
    private static final int MAX_SLUG_LENGTH = 260;

    private final NewsRepository news;
    private final JdbcTemplate jdbcTemplate;

    NewsIdentifierGenerator(NewsRepository news, JdbcTemplate jdbcTemplate) {
        this.news = news;
        this.jdbcTemplate = jdbcTemplate;
    }

    String uniqueSlug(String title) {
        String base = slugify(title);
        jdbcTemplate.queryForObject(
                "select 1 from (select pg_advisory_xact_lock(hashtextextended(?, 0))) locked",
                Integer.class,
                base
        );

        String candidate = base;
        int suffix = 2;
        while (news.existsBySlug(candidate)) {
            candidate = withSuffix(base, suffix++);
        }
        return candidate;
    }

    private String slugify(String value) {
        String transliterated = transliterateMongolianCyrillic(value.trim().toLowerCase(Locale.ROOT));
        String normalized = Normalizer.normalize(transliterated, Normalizer.Form.NFKD)
                .replaceAll("\\p{M}+", "")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        String base = normalized.isBlank() ? "news" : normalized;
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
