package com.hiliving.content.page;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "content_pages")
public class ContentPageEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    @Column(name = "navigation_label", nullable = false, length = 120)
    private String navigationLabel;

    @Column(nullable = false, length = 240)
    private String title;

    @Column(name = "content_html", nullable = false, columnDefinition = "text")
    private String contentHtml;

    @Column(nullable = false)
    private boolean published;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ContentPageEntity() {}

    void update(String title, String contentHtml, boolean published) {
        this.title = title.trim();
        this.contentHtml = contentHtml;
        this.published = published;
    }

    @PrePersist
    void createTimestamps() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void updateTimestamp() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getNavigationLabel() { return navigationLabel; }
    public String getTitle() { return title; }
    public String getContentHtml() { return contentHtml; }
    public boolean isPublished() { return published; }
    public int getDisplayOrder() { return displayOrder; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
