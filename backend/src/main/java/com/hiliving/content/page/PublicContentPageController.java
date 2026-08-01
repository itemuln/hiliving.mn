package com.hiliving.content.page;

import com.hiliving.api.ApiResponse;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
class PublicContentPageController {
    private final ContentPageService service;

    PublicContentPageController(ContentPageService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/pages/hiliving-mgl")
    ApiResponse<List<ContentPageResponse>> list() {
        return ApiResponse.of(service.publicList());
    }

    @GetMapping("/api/v1/pages/hiliving-mgl/{slug}")
    ApiResponse<ContentPageResponse> find(@PathVariable @Size(max = 80) String slug) {
        return ApiResponse.of(service.publicFind(slug));
    }
}
