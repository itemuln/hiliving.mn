package com.hiliving.content;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.springframework.stereotype.Component;

@Component
public class HtmlContentSanitizer {
    private static final PolicyFactory POLICY = new HtmlPolicyBuilder()
            .allowElements(
                    "p", "div", "span", "br", "hr",
                    "h1", "h2", "h3", "h4", "h5", "h6",
                    "strong", "b", "em", "i", "u", "s", "sub", "sup",
                    "blockquote", "pre", "code",
                    "ul", "ol", "li",
                    "a", "img", "figure", "figcaption",
                    "table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td"
            )
            .allowUrlProtocols("http", "https")
            .allowAttributes("href", "title", "target").onElements("a")
            .allowAttributes("src", "alt", "title", "width", "height").onElements("img")
            .allowAttributes("colspan", "rowspan", "scope").onElements("th", "td")
            .allowAttributes("start", "type").onElements("ol")
            .allowAttributes("type").onElements("ul")
            .allowStyling()
            .requireRelNofollowOnLinks()
            .toFactory();

    public String sanitize(String html) {
        return POLICY.sanitize(html == null ? "" : html.trim());
    }
}
