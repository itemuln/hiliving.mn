package com.hiliving.content.banner;
import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param; import java.time.Instant; import java.util.List;
public interface BannerRepository extends JpaRepository<BannerEntity,Long>{
    @Query("select b from BannerEntity b where b.active=true and (b.startsAt is null or b.startsAt<=:now) and (b.endsAt is null or b.endsAt>:now) order by b.displayOrder,b.id")
    List<BannerEntity> findPublic(@Param("now") Instant now); long countByActiveTrue();
}
