package com.hiliving.catalog.brand.admin;

import com.hiliving.admin.audit.AuditService;
import com.hiliving.api.error.ApiRequestException;
import com.hiliving.catalog.brand.persistence.*;
import com.hiliving.catalog.product.persistence.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class AdminBrandService {
    private final BrandRepository brands; private final ProductRepository products; private final AuditService audit;
    public AdminBrandService(BrandRepository brands, ProductRepository products, AuditService audit) { this.brands=brands; this.products=products; this.audit=audit; }
    @Transactional(readOnly=true) public List<AdminBrandResponse> list(String search) {
        String needle=search==null?"":search.trim().toLowerCase(Locale.ROOT);
        return brands.findAll().stream().filter(b->needle.isEmpty()||b.getName().toLowerCase(Locale.ROOT).contains(needle)||b.getSlug().contains(needle))
                .sorted(Comparator.comparing(BrandEntity::getName,String.CASE_INSENSITIVE_ORDER).thenComparing(BrandEntity::getId)).map(this::response).toList();
    }
    @Transactional(readOnly=true) public AdminBrandResponse find(Long id) { return response(require(id)); }
    @Transactional public AdminBrandResponse create(AdminBrandRequest r) {
        ensureSlug(r.slug(),null); BrandEntity b=BrandEntity.create(r.name().trim(),r.slug(),clean(r.logoUrl()),r.active());
        b.update(r.name().trim(),r.slug(),clean(r.logoUrl()),clean(r.description()),r.active()); brands.saveAndFlush(b);
        audit.record("BRAND_CREATED","BRAND",b.getId(),b.getSlug()); return response(b);
    }
    @Transactional public AdminBrandResponse update(Long id, AdminBrandRequest r) {
        BrandEntity b=require(id); ensureSlug(r.slug(),id); boolean wasActive=b.isActive(); boolean logoChanged=!Objects.equals(b.getLogoUrl(),clean(r.logoUrl()));
        b.update(r.name().trim(),r.slug(),clean(r.logoUrl()),clean(r.description()),r.active()); brands.flush();
        audit.record(wasActive&&!r.active()?"BRAND_DEACTIVATED":"BRAND_UPDATED","BRAND",id,r.slug()); if(logoChanged)audit.record("BRAND_LOGO_CHANGED","BRAND",id,null); return response(b);
    }
    @Transactional public void delete(Long id) { BrandEntity b=require(id); brands.delete(b); brands.flush(); audit.record("BRAND_DELETED","BRAND",id,b.getSlug()); }
    private void ensureSlug(String slug,Long id){boolean exists=id==null?brands.findBySlug(slug).isPresent():brands.existsBySlugAndIdNot(slug,id);if(exists)throw new ApiRequestException(HttpStatus.CONFLICT,"BRAND_SLUG_CONFLICT","Brand slug is already in use");}
    private BrandEntity require(Long id){return brands.findById(id).orElseThrow(()->new ApiRequestException(HttpStatus.NOT_FOUND,"BRAND_NOT_FOUND","Brand was not found"));}
    private AdminBrandResponse response(BrandEntity b){return new AdminBrandResponse(b.getId(),b.getName(),b.getSlug(),b.getLogoUrl(),b.getDescription(),b.getDisplayOrder(),b.isActive(),products.countByBrandId(b.getId()));}
    private static String clean(String v){return v==null||v.isBlank()?null:v.trim();}
}
