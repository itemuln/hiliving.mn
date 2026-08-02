package com.hiliving.content;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HtmlContentSanitizerTests {
    private final HtmlContentSanitizer sanitizer = new HtmlContentSanitizer();

    @Test
    void stripsScriptFromMalformedNoscriptAndStylePayload() {
        String sanitized = sanitizer.sanitize(
                "<noscript><style></noscript><script>alert(1)</script>"
        );

        assertThat(sanitized)
                .doesNotContain("noscript")
                .doesNotContain("style")
                .doesNotContain("script")
                .doesNotContain("alert(1)");
    }
}
