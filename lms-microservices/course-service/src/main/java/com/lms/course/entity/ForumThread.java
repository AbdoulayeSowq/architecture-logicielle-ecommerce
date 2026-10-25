package com.lms.course.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "forum_threads")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ForumThread {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String content;

    @Enumerated(EnumType.STRING)
    private ThreadTag tag;

    @Column(name = "author_id", nullable = false)
    private String authorId;

    @Column(name = "author_name")
    private String authorName;

    @ManyToOne
    @JoinColumn(name = "module_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private CModule module;

    // For direct database access
    @Column(name = "module_id", insertable = false, updatable = false)
    private Long moduleId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "thread", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<ForumPost> posts;

    @OneToOne(mappedBy = "thread")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ForumPost solution;

    @Column(columnDefinition = "bigint default 0")
    private Long viewCount = 0L;
    @Column(columnDefinition = "bigint default 0")
    private Long upvoteCount = 0L;
    private Boolean isClosed = false;

    public enum ThreadTag {
        QUESTION,
        DISCUSSION,
        ANNONCE
    }

    public ForumThread() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.viewCount == null) {
            this.viewCount = 0L;
        }
        if (this.upvoteCount == null) {
            this.upvoteCount = 0L;
        }
        if (this.isClosed == null) {
            this.isClosed = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public CModule getModule() { return module; }
    public void setModule(CModule module) { this.module = module; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<ForumPost> getPosts() { return posts; }
    public void setPosts(List<ForumPost> posts) { this.posts = posts; }

    public ForumPost getSolution() { return solution; }
    public void setSolution(ForumPost solution) { this.solution = solution; }

    public Long getViewCount() { return viewCount; }
    public void setViewCount(Long viewCount) { this.viewCount = viewCount; }

    public Long getUpvoteCount() { return upvoteCount; }
    public void setUpvoteCount(Long upvoteCount) { this.upvoteCount = upvoteCount; }

    public ThreadTag getTag() { return tag; }
    public void setTag(ThreadTag tag) { this.tag = tag; }

    public Boolean getIsClosed() { return isClosed; }
    public void setIsClosed(Boolean isClosed) { this.isClosed = isClosed; }
}
