package com.hiliving.content.banner;

import com.hiliving.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/admin/banners")
public class AdminBannerController {
    private final BannerService service;

    public AdminBannerController(BannerService service) {
        this.service = service;
    }

    @GetMapping
    ApiResponse<List<BannerResponse>> list() {
        return ApiResponse.of(service.adminList());
    }

    @GetMapping("/{id}")
    ApiResponse<BannerResponse> find(@PathVariable @Positive Long id) {
        return ApiResponse.of(service.find(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<BannerResponse> create(@Valid @RequestBody BannerRequest request) {
        return ApiResponse.of(service.create(request));
    }

    @PatchMapping("/{id}")
    ApiResponse<BannerResponse> update(
            @PathVariable @Positive Long id, @Valid @RequestBody BannerRequest request) {
        return ApiResponse.of(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable @Positive Long id) {
        service.delete(id);
    }
}
