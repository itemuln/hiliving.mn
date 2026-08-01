package com.hiliving.content.page;

import com.hiliving.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/admin/pages")
class AdminContentPageController {
    private final ContentPageService service;

    AdminContentPageController(ContentPageService service) {
        this.service = service;
    }

    @GetMapping
    ApiResponse<List<ContentPageResponse>> list() {
        return ApiResponse.of(service.adminList());
    }

    @GetMapping("/{id}")
    ApiResponse<ContentPageResponse> find(@PathVariable @Positive Long id) {
        return ApiResponse.of(service.find(id));
    }

    @PatchMapping("/{id}")
    ApiResponse<ContentPageResponse> update(
            @PathVariable @Positive Long id,
            @Valid @RequestBody ContentPageRequest request
    ) {
        return ApiResponse.of(service.update(id, request));
    }
}
