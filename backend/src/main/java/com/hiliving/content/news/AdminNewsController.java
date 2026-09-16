package com.hiliving.content.news;

import com.hiliving.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/admin/news")
public class AdminNewsController {
    private final NewsService service;

    public AdminNewsController(NewsService service) {
        this.service = service;
    }

    @GetMapping
    ApiResponse<List<NewsResponse>> list(@RequestParam(required = false) @Size(max = 100) String search) {
        return ApiResponse.of(service.adminList(search));
    }

    @GetMapping("/{id}")
    ApiResponse<NewsResponse> find(@PathVariable @Positive Long id) {
        return ApiResponse.of(service.find(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<NewsResponse> create(@Valid @RequestBody NewsRequest request) {
        return ApiResponse.of(service.create(request));
    }

    @PatchMapping("/{id}")
    ApiResponse<NewsResponse> update(
            @PathVariable @Positive Long id, @Valid @RequestBody NewsRequest request) {
        return ApiResponse.of(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable @Positive Long id) {
        service.delete(id);
    }
}
