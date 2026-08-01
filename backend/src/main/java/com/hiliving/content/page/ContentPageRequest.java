package com.hiliving.content.page;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContentPageRequest(
        @NotBlank @Size(max = 240) String title,
        @NotNull @Size(max = 100_000) String contentHtml,
        boolean published
) {}
