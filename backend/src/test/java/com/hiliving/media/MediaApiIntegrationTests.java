package com.hiliving.media;

import com.hiliving.TestcontainersConfiguration;
import com.hiliving.identity.user.persistence.MembershipTierRepository;
import com.hiliving.identity.user.persistence.UserEntity;
import com.hiliving.identity.user.persistence.UserRepository;
import com.hiliving.identity.user.persistence.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest
@Transactional
class MediaApiIntegrationTests {
    private static final Path MEDIA_ROOT = temporaryRoot();
    private static final String ADMIN = "media-admin@example.com";

    @DynamicPropertySource
    static void mediaProperties(DynamicPropertyRegistry registry) {
        registry.add("hiliving.media.storage-path", () -> MEDIA_ROOT.toString());
    }

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired MembershipTierRepository memberships;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void createAdmin() throws Exception {
        clearRoot();
        UserEntity admin = UserEntity.customer("Media", "Admin", ADMIN, "+97699001122", "{noop}unused",
                memberships.findByCodeAndActiveTrue("REGULAR").orElseThrow());
        ReflectionTestUtils.setField(admin, "role", UserRole.ADMIN);
        users.saveAndFlush(admin);
    }

    @Test
    void uploadIsAdminOnlyAndCsrfProtected() throws Exception {
        MockMultipartFile image = image("product.jpg", "image/jpeg", "JPEG", 20, 10);
        mvc.perform(multipart("/api/v1/admin/media/images").file(image).param("purpose", "PRODUCT").with(csrf()))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error.code").value("AUTHENTICATION_REQUIRED"));
        mvc.perform(multipart("/api/v1/admin/media/images").file(image).param("purpose", "PRODUCT").with(csrf()).with(user("customer").roles("CUSTOMER")))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));
        mvc.perform(multipart("/api/v1/admin/media/images").file(image).param("purpose", "PRODUCT").with(admin()))
                .andExpect(status().isForbidden());
    }

    @Test
    void validJpegAndPngAreProcessedStoredAndRecordedWithRelativeKeys() throws Exception {
        var jpeg = upload(image("original-name.jpg", "image/jpeg", "JPEG", 1800, 900), "PRODUCT")
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.contentType").value("image/jpeg"))
                .andExpect(jsonPath("$.data.width").value(1600)).andExpect(jsonPath("$.data.height").value(800))
                .andExpect(jsonPath("$.data.storageKey").value(org.hamcrest.Matchers.matchesPattern("products/[0-9a-f-]+\\.jpg")))
                .andExpect(jsonPath("$.data.url").value(org.hamcrest.Matchers.startsWith("/media/products/"))).andReturn();
        String jpegKey = com.jayway.jsonpath.JsonPath.read(jpeg.getResponse().getContentAsString(), "$.data.storageKey");
        assertThat(Files.isRegularFile(MEDIA_ROOT.resolve(jpegKey))).isTrue();
        assertThat(Path.of(jpegKey).isAbsolute()).isFalse();
        assertThat(Path.of(jpegKey).getFileName().toString()).doesNotContain("original-name");

        upload(image("brand.png", "image/png", "PNG", 30, 20), "BRAND")
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.contentType").value("image/png"))
                .andExpect(jsonPath("$.data.storageKey").value(org.hamcrest.Matchers.matchesPattern("brands/[0-9a-f-]+\\.png")));
        assertThat(jdbc.queryForObject("select count(*) from media_assets", Integer.class)).isEqualTo(2);
        assertThat(jdbc.queryForObject("select storage_provider from media_assets order by id limit 1", String.class)).isEqualTo("LOCAL");
        assertThat(jdbc.queryForObject("select bool_and(storage_key not like '/%') from media_assets", Boolean.class)).isTrue();
    }

    @Test
    void validationRejectsEmptyOversizedSpoofedUnsupportedMalformedAndExcessiveImages() throws Exception {
        upload(new MockMultipartFile("file", "empty.jpg", "image/jpeg", new byte[0]), "PRODUCT")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("MEDIA_FILE_EMPTY"));
        upload(new MockMultipartFile("file", "large.png", "image/png", new byte[(2 * 1024 * 1024) + 1]), "BRAND")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("MEDIA_FILE_TOO_LARGE"));
        upload(image("spoof.jpg", "image/jpeg", "PNG", 10, 10), "PRODUCT")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("MEDIA_CONTENT_TYPE_MISMATCH"));
        upload(image("spoof.jpg", "image/png", "PNG", 10, 10), "PRODUCT")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("MEDIA_EXTENSION_MISMATCH"));
        upload(image("animated.gif", "image/gif", "GIF", 10, 10), "PRODUCT")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("MEDIA_FORMAT_UNSUPPORTED"));
        upload(new MockMultipartFile("file", "vector.svg", "image/svg+xml", "<svg/>".getBytes()), "PRODUCT")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("MEDIA_IMAGE_INVALID"));
        upload(new MockMultipartFile("file", "broken.jpg", "image/jpeg", "not an image".getBytes()), "PRODUCT")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("MEDIA_IMAGE_INVALID"));
        upload(image("wide.png", "image/png", "PNG", 3001, 1), "BRAND")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("MEDIA_DIMENSIONS_EXCEEDED"));
        mvc.perform(multipart("/api/v1/admin/media/images").file(image("x.png", "image/png", "PNG", 10, 10))
                        .param("purpose", "OTHER").with(admin()).with(csrf()))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
        assertThat(jdbc.queryForObject("select count(*) from media_assets", Integer.class)).isZero();
    }

    @Test
    void storedMediaIsPublicReadOnlyAndHasNoDirectoryListing() throws Exception {
        var result = upload(image("news.png", "image/png", "PNG", 40, 25), "NEWS").andExpect(status().isCreated()).andReturn();
        String url = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.data.url");
        mvc.perform(get(url)).andExpect(status().isOk()).andExpect(content().contentType("image/png"));
        mvc.perform(head(url)).andExpect(status().isOk());
        mvc.perform(get("/media/news/missing.png")).andExpect(status().isNotFound());
        mvc.perform(get("/media/news/")).andExpect(status().isNotFound());
        mvc.perform(post(url).with(csrf())).andExpect(status().isUnauthorized());
    }

    @Test
    void uploadedRelativeUrlsWorkAcrossProductBrandBannerAndNewsContracts() throws Exception {
        String productUrl = url(upload(image("product.png", "image/png", "PNG", 20, 20), "PRODUCT").andReturn());
        String brandUrl = url(upload(image("brand.png", "image/png", "PNG", 20, 20), "BRAND").andReturn());
        String bannerUrl = url(upload(image("banner.jpg", "image/jpeg", "JPEG", 40, 20), "BANNER").andReturn());
        String newsUrl = url(upload(image("news.jpg", "image/jpeg", "JPEG", 30, 20), "NEWS").andReturn());

        var category = mvc.perform(post("/api/v1/admin/categories").with(admin()).with(csrf()).contentType("application/json").content("""
                {"name":"Media","slug":"media","description":"Media","sortOrder":0,"active":true}
                """)).andExpect(status().isCreated()).andReturn();
        long categoryId = ((Number) com.jayway.jsonpath.JsonPath.read(category.getResponse().getContentAsString(), "$.data.id")).longValue();
        mvc.perform(post("/api/v1/admin/products").with(admin()).with(csrf()).contentType("application/json").content("""
                {"name":"Media product","slug":"media-product","productCode":"MEDIA-1","basePrice":10,"categoryId":%d,"lifecycle":"ACTIVE","stockQuantity":1,"lowStockThreshold":1,"featured":false,"newProduct":false,"active":true,"membershipDiscountEligible":true,"images":[{"imageUrl":"%s","sortOrder":0,"primaryImage":true}]}
                """.formatted(categoryId, productUrl))).andExpect(status().isCreated()).andExpect(jsonPath("$.data.images[0].imageUrl").value(productUrl));
        mvc.perform(post("/api/v1/admin/brands").with(admin()).with(csrf()).contentType("application/json").content("""
                {"name":"Media brand","slug":"media-brand","logoUrl":"%s","sortOrder":0,"active":true}
                """.formatted(brandUrl))).andExpect(status().isCreated()).andExpect(jsonPath("$.data.logoUrl").value(brandUrl));
        mvc.perform(post("/api/v1/admin/banners").with(admin()).with(csrf()).contentType("application/json").content("""
                {"title":"Media banner","imageUrl":"%s","sortOrder":0,"active":true}
                """.formatted(bannerUrl))).andExpect(status().isCreated()).andExpect(jsonPath("$.data.imageUrl").value(bannerUrl));
        mvc.perform(post("/api/v1/admin/news").with(admin()).with(csrf()).contentType("application/json").content("""
                {"title":"Media news","slug":"media-news","summary":"Summary","content":"Content","thumbnailUrl":"%s","published":true,"sortOrder":0}
                """.formatted(newsUrl))).andExpect(status().isCreated()).andExpect(jsonPath("$.data.thumbnailUrl").value(newsUrl));
    }

    private org.springframework.test.web.servlet.ResultActions upload(MockMultipartFile file, String purpose) throws Exception {
        return mvc.perform(multipart("/api/v1/admin/media/images").file(file).param("purpose", purpose).with(admin()).with(csrf()));
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor admin() { return user(ADMIN).roles("ADMIN"); }
    private static String url(org.springframework.test.web.servlet.MvcResult result) throws Exception { return com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.data.url"); }

    private static MockMultipartFile image(String filename, String contentType, String format, int width, int height) throws Exception {
        BufferedImage image = new BufferedImage(width, height, format.equals("JPEG") ? BufferedImage.TYPE_INT_RGB : BufferedImage.TYPE_INT_ARGB);
        var graphics = image.createGraphics();graphics.setColor(Color.ORANGE);graphics.fillRect(0, 0, width, height);graphics.dispose();
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();ImageIO.write(image, format, bytes);
        return new MockMultipartFile("file", filename, contentType, bytes.toByteArray());
    }

    private void clearRoot() throws Exception {
        if (Files.exists(MEDIA_ROOT)) try (var paths = Files.walk(MEDIA_ROOT)) { paths.sorted(java.util.Comparator.reverseOrder()).filter(path -> !path.equals(MEDIA_ROOT)).forEach(path -> { try { Files.deleteIfExists(path); } catch (Exception exception) { throw new RuntimeException(exception); } }); }
        Files.createDirectories(MEDIA_ROOT);
    }

    private static Path temporaryRoot() {
        try { return Files.createTempDirectory("hiliving-media-tests-"); }
        catch (Exception exception) { throw new ExceptionInInitializerError(exception); }
    }
}
