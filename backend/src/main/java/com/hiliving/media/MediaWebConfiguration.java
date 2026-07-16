package com.hiliving.media;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;
import java.nio.file.Path;

@Configuration
class MediaWebConfiguration implements WebMvcConfigurer {
    private final MediaProperties properties;

    MediaWebConfiguration(MediaProperties properties) { this.properties = properties; }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Path.of(properties.storagePath()).toAbsolutePath().normalize().toUri().toString();
        if (!location.endsWith("/")) location += "/";
        registry.addResourceHandler("/media/**")
                .addResourceLocations(location)
                .setCachePeriod((int) Duration.ofDays(30).toSeconds());
    }
}
