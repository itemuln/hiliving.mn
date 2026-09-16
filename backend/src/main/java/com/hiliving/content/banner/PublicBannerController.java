package com.hiliving.content.banner;

import com.hiliving.api.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicBannerController {
    private final BannerService service;

    public PublicBannerController(BannerService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/banners")
    ApiResponse<List<BannerResponse>> list(@RequestParam BannerPlacement placement) {
        return ApiResponse.of(service.publicList(placement));
    }
}
