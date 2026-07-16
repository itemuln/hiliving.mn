package com.hiliving.media;

import com.hiliving.api.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/media")
class AdminMediaController {
    private final MediaService media;

    AdminMediaController(MediaService media) { this.media = media; }

    @PostMapping(path = "/images", consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<MediaUploadResponse> upload(@RequestPart("file") MultipartFile file,
                                            @RequestParam MediaPurpose purpose,
                                            Authentication authentication) {
        return ApiResponse.of(media.upload(file, purpose, authentication.getName()));
    }
}
