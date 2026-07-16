package com.hiliving.catalog.category.admin;

import com.hiliving.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Validated @RestController @RequestMapping("/api/v1/admin/categories")
public class AdminCategoryController {
    private final AdminCategoryService service;
    public AdminCategoryController(AdminCategoryService service) { this.service = service; }
    @GetMapping public ApiResponse<List<AdminCategoryResponse>> list(@RequestParam(required = false) @Size(max = 100) String search) { return ApiResponse.of(service.list(search)); }
    @GetMapping("/{id}") public ApiResponse<AdminCategoryResponse> find(@PathVariable @Positive Long id) { return ApiResponse.of(service.find(id)); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ApiResponse<AdminCategoryResponse> create(@Valid @RequestBody AdminCategoryRequest request) { return ApiResponse.of(service.create(request)); }
    @PatchMapping("/{id}") public ApiResponse<AdminCategoryResponse> update(@PathVariable @Positive Long id, @Valid @RequestBody AdminCategoryRequest request) { return ApiResponse.of(service.update(id, request)); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable @Positive Long id) { service.delete(id); }
}
