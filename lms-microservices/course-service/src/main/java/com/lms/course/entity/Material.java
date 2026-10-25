package com.lms.course.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Material (Ressource pédagogique)
 * Lié à un Module (EC) et une Séance (Course)
 * Note: Pour permettre la réutilisation des materials entre séances,
 * une migration de base de données serait nécessaire pour rendre course_id nullable
 */
@Entity
@Table(name = "materials")
public class Material {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String description;
    private String type; // e.g., "PDF", "VIDEO", "LINK", "DOCUMENT"
    private String fileUrl; // URL or path to the resource
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private CModule module;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = true)
    private Course course;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    public Material() {}

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    @JsonIgnore
    public CModule getModule() { return module; }
    public void setModule(CModule module) { this.module = module; }

    @JsonIgnore
    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
}
