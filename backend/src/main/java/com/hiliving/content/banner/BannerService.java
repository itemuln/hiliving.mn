package com.hiliving.content.banner;
import com.hiliving.admin.audit.AuditService; import com.hiliving.api.error.ApiRequestException; import org.springframework.data.domain.Sort; import org.springframework.http.HttpStatus; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import java.time.*; import java.util.*;
@Service public class BannerService{
    private final BannerRepository banners;private final AuditService audit;private final Clock clock=Clock.systemUTC();public BannerService(BannerRepository banners,AuditService audit){this.banners=banners;this.audit=audit;}
    @Transactional(readOnly=true)public List<BannerResponse> publicList(){return banners.findPublic(clock.instant()).stream().map(BannerResponse::from).toList();}
    @Transactional(readOnly=true)public List<BannerResponse> adminList(){return banners.findAll(Sort.by("displayOrder","id")).stream().map(BannerResponse::from).toList();}
    @Transactional(readOnly=true)public BannerResponse find(Long id){return BannerResponse.from(require(id));}
    @Transactional public BannerResponse create(BannerRequest r){validate(r);BannerEntity b=banners.saveAndFlush(BannerEntity.create(r));audit.record("BANNER_CREATED","BANNER",b.getId(),b.getTitle());return BannerResponse.from(b);}
    @Transactional public BannerResponse update(Long id,BannerRequest r){validate(r);BannerEntity b=require(id);boolean was=b.isActive();boolean imageChanged=!Objects.equals(b.getImageUrl(),clean(r.imageUrl()))||!Objects.equals(b.getMobileImageUrl(),clean(r.mobileImageUrl()));b.update(r);banners.flush();audit.record(was&&!r.active()?"BANNER_DEACTIVATED":"BANNER_UPDATED","BANNER",id,b.getTitle());if(imageChanged)audit.record("BANNER_IMAGE_CHANGED","BANNER",id,null);return BannerResponse.from(b);}
    @Transactional public void delete(Long id){BannerEntity b=require(id);banners.delete(b);audit.record("BANNER_DELETED","BANNER",id,b.getTitle());}
    private void validate(BannerRequest r){if(r.startsAt()!=null&&r.endsAt()!=null&&!r.endsAt().isAfter(r.startsAt()))throw new ApiRequestException(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR","Banner end time must be after start time");if(r.linkUrl()!=null&&!r.linkUrl().isBlank()&&!(r.linkUrl().startsWith("/")||r.linkUrl().startsWith("https://")||r.linkUrl().startsWith("http://")))throw new ApiRequestException(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR","Banner link must be an internal path or HTTP URL");}
    private BannerEntity require(Long id){return banners.findById(id).orElseThrow(()->new ApiRequestException(HttpStatus.NOT_FOUND,"BANNER_NOT_FOUND","Banner was not found"));}
    private static String clean(String value){return value==null||value.isBlank()?null:value.trim();}
}
