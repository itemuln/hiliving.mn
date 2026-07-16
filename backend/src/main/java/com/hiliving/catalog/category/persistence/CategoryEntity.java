package com.hiliving.catalog.category.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

@Entity
@Table(name = "categories")
public class CategoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    private String name;

    @NotBlank
    @Size(max = 160)
    @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$")
    @Column(nullable = false, unique = true, length = 160)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private CategoryEntity parent;

    @Size(max = 1000)
    @Column(length = 1000)
    private String description;

    @Min(0)
    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean active;

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @NotNull
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CategoryEntity() {
    }

    private CategoryEntity(String name, String slug, CategoryEntity parent, int displayOrder, boolean active) {
        this.name = name;
        this.slug = slug;
        this.parent = parent;
        this.displayOrder = displayOrder;
        this.active = active;
    }

    public static CategoryEntity create(
            String name,
            String slug,
            CategoryEntity parent,
            int displayOrder,
            boolean active
    ) {
        return new CategoryEntity(name, slug, parent, displayOrder, active);
    }

    public void update(String name, String slug, CategoryEntity parent, String description, int displayOrder, boolean active) {
        this.name = name;
        this.slug = slug;
        this.parent = parent;
        this.description = description;
        this.displayOrder = displayOrder;
        this.active = active;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public CategoryEntity getParent() {
        return parent;
    }

    public String getDescription() { return description; }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public boolean isActive() {
        return active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
