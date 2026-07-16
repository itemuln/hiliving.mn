package com.hiliving.catalog.brand.admin;

import com.hiliving.api.ApiResponse;
import jakarta.validation.Valid; import jakarta.validation.constraints.*;
import org.springframework.http.*; import org.springframework.validation.annotation.Validated; import org.springframework.web.bind.annotation.*;
import java.util.List;

@Validated @RestController @RequestMapping("/api/v1/admin/brands")
public class AdminBrandController {
    private final AdminBrandService service; public AdminBrandController(AdminBrandService service){this.service=service;}
    @GetMapping public ApiResponse<List<AdminBrandResponse>> list(@RequestParam(required=false) @Size(max=100) String search){return ApiResponse.of(service.list(search));}
    @GetMapping("/{id}") public ApiResponse<AdminBrandResponse> find(@PathVariable @Positive Long id){return ApiResponse.of(service.find(id));}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ApiResponse<AdminBrandResponse> create(@Valid @RequestBody AdminBrandRequest r){return ApiResponse.of(service.create(r));}
    @PatchMapping("/{id}") public ApiResponse<AdminBrandResponse> update(@PathVariable @Positive Long id,@Valid @RequestBody AdminBrandRequest r){return ApiResponse.of(service.update(id,r));}
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable @Positive Long id){service.delete(id);}
}
