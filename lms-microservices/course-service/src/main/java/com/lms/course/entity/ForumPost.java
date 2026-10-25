package com.lms.course.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "forum_posts")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ForumPost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String content;

    @Column(name = "author_id", nullable = false)
    private String authorId;

    @Column(name = "author_name")
    private String authorName;

    @ManyToOne
    @JoinColumn(name = "thread_id", nullable = false)
    @JsonIgnore
    private ForumThread thread;

    @ManyToOne
    @JoinColumn(name = "parent_post_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "replies"})
    private ForumPost parentPost;

    @OneToMany(mappedBy = "parentPost", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<ForumPost> replies;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    private Long upvoteCount;
    private Boolean isSolution;
    private Boolean isEdited;

    public ForumPost() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.upvoteCount == null) {
            this.upvoteCount = 0L;
        }
        if (this.isSolution == null) {
            this.isSolution = false;
        }
        if (this.isEdited == null) {
            this.isEdited = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public ForumThread getThread() { return thread; }
    public void setThread(ForumThread thread) { this.thread = thread; }

    public ForumPost getParentPost() { return parentPost; }
    public void setParentPost(ForumPost parentPost) { this.parentPost = parentPost; }

    public List<ForumPost> getReplies() { return replies; }
    public void setReplies(List<ForumPost> replies) { this.replies = replies; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Long getUpvoteCount() { return upvoteCount; }
    public void setUpvoteCount(Long upvoteCount) { this.upvoteCount = upvoteCount; }

    public Boolean getIsSolution() { return isSolution; }
    public void setIsSolution(Boolean isSolution) { this.isSolution = isSolution; }

    public Boolean getIsEdited() { return isEdited; }
    public void setIsEdited(Boolean isEdited) { this.isEdited = isEdited; }
}
