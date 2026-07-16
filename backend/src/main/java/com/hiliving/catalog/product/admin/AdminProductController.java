package com.hiliving.catalog.product.admin;

import com.hiliving.api.*; import com.hiliving.catalog.product.persistence.ProductStatus;
import jakarta.validation.Valid; import jakarta.validation.constraints.*; import org.springframework.http.*; import org.springframework.validation.annotation.Validated; import org.springframework.web.bind.annotation.*;

@Validated @RestController @RequestMapping("/api/v1/admin/products")
public class AdminProductController {
    private final AdminProductService service;public AdminProductController(AdminProductService service){this.service=service;}
    @GetMapping public ApiResponse<PagedResponse<AdminProductResponse>> list(@RequestParam(defaultValue="0") @Min(0) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size,@RequestParam(required=false) @Size(max=100) String search,@RequestParam(required=false) Long categoryId,@RequestParam(required=false) Long brandId,@RequestParam(required=false) ProductStatus lifecycle,@RequestParam(required=false) Boolean featured,@RequestParam(required=false) Boolean newProduct,@RequestParam(required=false) Boolean active,@RequestParam(required=false) Boolean membershipDiscountEligible,@RequestParam(required=false) InventoryState inventoryState,@RequestParam(required=false) Boolean lowStock,@RequestParam(defaultValue="newest") String sort){return ApiResponse.of(service.list(page,size,search,categoryId,brandId,lifecycle,featured,newProduct,active,membershipDiscountEligible,inventoryState,lowStock,sort));}
    @GetMapping("/{id}") public ApiResponse<AdminProductResponse> find(@PathVariable @Positive Long id){return ApiResponse.of(service.find(id));}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ApiResponse<AdminProductResponse> create(@Valid @RequestBody AdminProductRequest r){return ApiResponse.of(service.create(r));}
    @PatchMapping("/{id}") public ApiResponse<AdminProductResponse> update(@PathVariable @Positive Long id,@Valid @RequestBody AdminProductRequest r){return ApiResponse.of(service.update(id,r));}
    @PostMapping("/{id}/archive") public ApiResponse<AdminProductResponse> archive(@PathVariable @Positive Long id){return ApiResponse.of(service.archive(id));}
    @PostMapping("/{id}/restore") public ApiResponse<AdminProductResponse> restore(@PathVariable @Positive Long id){return ApiResponse.of(service.restore(id));}
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable @Positive Long id){service.delete(id);}
}
