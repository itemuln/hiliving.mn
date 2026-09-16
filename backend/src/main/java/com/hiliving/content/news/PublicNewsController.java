package com.hiliving.content.news;

import com.hiliving.api.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicNewsController {
    private final NewsService service;

    public PublicNewsController(NewsService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/news")
    ApiResponse<List<NewsResponse>> list() {
        return ApiResponse.of(service.publicList());
    }

    @GetMapping("/api/v1/news/{slug}")
    ApiResponse<NewsResponse> find(@PathVariable String slug) {
        return ApiResponse.of(service.publicFind(slug));
    }
}
