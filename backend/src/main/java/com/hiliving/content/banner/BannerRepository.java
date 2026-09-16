package com.hiliving.content.banner;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface BannerRepository extends JpaRepository<BannerEntity, Long> {
    @Query("""
            select banner
            from BannerEntity banner
            where banner.placement = :placement
              and banner.active = true
              and (banner.startsAt is null or banner.startsAt <= :now)
              and (banner.endsAt is null or banner.endsAt > :now)
            order by banner.displayOrder, banner.id
            """)
    List<BannerEntity> findPublic(
            @Param("now") Instant now,
            @Param("placement") BannerPlacement placement
    );

    long countByActiveTrue();
}
