package com.hiliving.catalog.product.admin;

import com.hiliving.admin.audit.AuditService;
import com.hiliving.api.PagedResponse; import com.hiliving.api.error.ApiRequestException;
import com.hiliving.catalog.brand.persistence.*; import com.hiliving.catalog.category.persistence.*;
import com.hiliving.catalog.product.api.*; import com.hiliving.catalog.product.persistence.*;
import org.springframework.data.domain.*; import org.springframework.http.HttpStatus; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class AdminProductService {
    private static final Map<String,Sort> SORTS=Map.of(
            "newest",Sort.by(Sort.Direction.DESC,"createdAt","id"),"oldest",Sort.by("createdAt","id"),
            "name_asc",Sort.by("name","id"),"name_desc",Sort.by(Sort.Direction.DESC,"name").and(Sort.by("id")),
            "price_asc",Sort.by("price","id"),"price_desc",Sort.by(Sort.Direction.DESC,"price").and(Sort.by("id")),
            "stock_asc",Sort.by("stockQuantity","id"),"stock_desc",Sort.by(Sort.Direction.DESC,"stockQuantity").and(Sort.by("id")));
    private final ProductRepository products; private final CategoryRepository categories; private final BrandRepository brands; private final AuditService audit;
    public AdminProductService(ProductRepository products,CategoryRepository categories,BrandRepository brands,AuditService audit){this.products=products;this.categories=categories;this.brands=brands;this.audit=audit;}
    @Transactional(readOnly=true)
    public PagedResponse<AdminProductResponse> list(int page,int size,String search,Long categoryId,Long brandId,ProductStatus lifecycle,Boolean featured,Boolean newProduct,Boolean active,Boolean membershipEligible,InventoryState inventoryState,Boolean lowStock,String sort){
        Sort selected=SORTS.get(sort); if(selected==null)throw validation("sort","Unsupported sort value");
        Page<AdminProductResponse> result=products.findAll(AdminProductSpecifications.filter(search,categoryId,brandId,lifecycle,featured,newProduct,active,membershipEligible,inventoryState,lowStock),PageRequest.of(page,size,selected)).map(this::response);
        return new PagedResponse<>(result.getContent(),result.getNumber(),result.getSize(),result.getTotalElements(),result.getTotalPages(),result.isFirst(),result.isLast());
    }
    @Transactional(readOnly=true) public AdminProductResponse find(Long id){return response(require(id));}
    @Transactional public AdminProductResponse create(AdminProductRequest r){validate(r,null);CategoryEntity c=category(r.categoryId());BrandEntity b=brand(r.brandId());
        ProductEntity p=ProductEntity.create(clean(r.name()),r.slug(),cleanNullable(r.shortDescription()),cleanNullable(r.description()),r.basePrice(),r.discountPrice(),c,b,r.lifecycle(),r.featured());
        p.initializeAdministrationFields(clean(r.productCode()),r.stockQuantity(),r.lowStockThreshold(),r.membershipDiscountEligible(),r.newProduct(),r.active()); addImages(p,r.images()); products.saveAndFlush(p);
        audit.record("PRODUCT_CREATED","PRODUCT",p.getId(),p.getProductCode());return response(p);}
    @Transactional public AdminProductResponse update(Long id,AdminProductRequest r){ProductEntity p=require(id);validate(r,id);CategoryEntity c=category(r.categoryId());BrandEntity b=brand(r.brandId());
        boolean priceChanged=p.getPrice().compareTo(r.basePrice())!=0||!Objects.equals(p.getDiscountPrice(),r.discountPrice());boolean inventoryChanged=p.getStockQuantity()!=r.stockQuantity()||p.getLowStockThreshold()!=r.lowStockThreshold();boolean eligibilityChanged=p.isMembershipDiscountEligible()!=r.membershipDiscountEligible();boolean imagesChanged=!p.getImages().stream().map(ProductImageEntity::getImageUrl).toList().equals(r.images().stream().sorted(Comparator.comparingInt(AdminProductImageRequest::sortOrder)).map(i->i.imageUrl().trim()).toList());
        p.update(clean(r.name()),r.slug(),clean(r.productCode()),cleanNullable(r.shortDescription()),cleanNullable(r.description()),r.basePrice(),r.discountPrice(),c,b,r.lifecycle(),r.featured(),r.newProduct(),r.active(),r.stockQuantity(),r.lowStockThreshold(),r.membershipDiscountEligible());p.clearImages();products.flush();addImages(p,r.images());products.flush();
        audit.record("PRODUCT_UPDATED","PRODUCT",id,p.getProductCode());if(priceChanged)audit.record("PRODUCT_PRICE_CHANGED","PRODUCT",id,null);if(inventoryChanged)audit.record("PRODUCT_INVENTORY_CHANGED","PRODUCT",id,null);if(eligibilityChanged)audit.record("PRODUCT_MEMBERSHIP_ELIGIBILITY_CHANGED","PRODUCT",id,String.valueOf(r.membershipDiscountEligible()));if(imagesChanged)audit.record("PRODUCT_IMAGE_CHANGED","PRODUCT",id,null);return response(p);}
    @Transactional public AdminProductResponse archive(Long id){ProductEntity p=require(id);p.changeStatus(ProductStatus.ARCHIVED);audit.record("PRODUCT_ARCHIVED","PRODUCT",id,p.getProductCode());return response(p);}
    @Transactional public AdminProductResponse restore(Long id){ProductEntity p=require(id);p.changeStatus(ProductStatus.DRAFT);audit.record("PRODUCT_RESTORED","PRODUCT",id,p.getProductCode());return response(p);}
    @Transactional public void delete(Long id){ProductEntity p=require(id);products.delete(p);audit.record("PRODUCT_DELETED","PRODUCT",id,p.getProductCode());}
    private void validate(AdminProductRequest r,Long id){if(r.discountPrice()!=null&&r.discountPrice().compareTo(r.basePrice())>=0)throw new ApiRequestException(HttpStatus.BAD_REQUEST,"INVALID_DISCOUNT_PRICE","Discount price must be lower than base price");
        if(products.existsBySlugAndIdNot(r.slug(),id==null?-1L:id))throw conflict("PRODUCT_SLUG_CONFLICT","Product slug is already in use");if(products.existsByProductCodeAndIdNot(clean(r.productCode()),id==null?-1L:id))throw conflict("PRODUCT_CODE_CONFLICT","Product code is already in use");
        if(r.images().size()>4)throw new ApiRequestException(HttpStatus.BAD_REQUEST,"PRODUCT_IMAGE_LIMIT_EXCEEDED","A product may have at most four images");long primary=r.images().stream().filter(AdminProductImageRequest::primaryImage).count();if(primary>1||(r.lifecycle()==ProductStatus.ACTIVE&&r.active()&&primary!=1))throw new ApiRequestException(HttpStatus.BAD_REQUEST,"PRODUCT_PRIMARY_IMAGE_INVALID","An active product requires exactly one primary image");
        if(r.images().stream().map(AdminProductImageRequest::sortOrder).distinct().count()!=r.images().size())throw validation("images","Image sort order must be unique");if(r.images().stream().map(i->i.imageUrl().trim()).distinct().count()!=r.images().size())throw validation("images","Image URLs must be unique");}
    private void addImages(ProductEntity p,List<AdminProductImageRequest> images){images.stream().sorted(Comparator.comparingInt(AdminProductImageRequest::sortOrder)).forEach(i->p.addImage(i.imageUrl().trim(),cleanNullable(i.altText()),i.sortOrder(),i.primaryImage()));}
    private ProductEntity require(Long id){return products.findWithDetailsById(id).orElseThrow(()->new ApiRequestException(HttpStatus.NOT_FOUND,"PRODUCT_NOT_FOUND","Product was not found"));}
    private CategoryEntity category(Long id){return categories.findById(id).orElseThrow(()->new ApiRequestException(HttpStatus.BAD_REQUEST,"CATEGORY_NOT_FOUND","Category was not found"));}
    private BrandEntity brand(Long id){return id==null?null:brands.findById(id).orElseThrow(()->new ApiRequestException(HttpStatus.BAD_REQUEST,"BRAND_NOT_FOUND","Brand was not found"));}
    private AdminProductResponse response(ProductEntity p){return new AdminProductResponse(p.getId(),p.getName(),p.getSlug(),p.getProductCode(),p.getShortDescription(),p.getDescription(),p.getPrice(),p.getDiscountPrice(),ref(p.getCategory()),ref(p.getBrand()),p.getStatus(),p.getStockQuantity(),p.getLowStockThreshold(),InventoryState.of(p.getStockQuantity(),p.getLowStockThreshold()),p.isFeatured(),p.isNewProduct(),p.isActive(),p.isMembershipDiscountEligible(),p.getImages().stream().map(i->new ProductImageResponse(i.getId(),i.getImageUrl(),i.getAltText(),i.getDisplayOrder(),i.isPrimaryImage())).toList(),p.getCreatedAt(),p.getUpdatedAt());}
    private CatalogReferenceResponse ref(CategoryEntity c){return new CatalogReferenceResponse(c.getId(),c.getName(),c.getSlug());}private CatalogReferenceResponse ref(BrandEntity b){return b==null?null:new CatalogReferenceResponse(b.getId(),b.getName(),b.getSlug());}
    private static ApiRequestException validation(String field,String message){return new ApiRequestException(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR",field+": "+message);}private static ApiRequestException conflict(String code,String message){return new ApiRequestException(HttpStatus.CONFLICT,code,message);}private static String clean(String v){return v.trim();}private static String cleanNullable(String v){return v==null||v.isBlank()?null:v.trim();}
}
