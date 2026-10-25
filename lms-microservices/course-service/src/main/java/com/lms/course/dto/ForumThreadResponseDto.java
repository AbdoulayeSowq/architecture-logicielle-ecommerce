package com.lms.course.dto;

import com.lms.course.entity.ForumThread;

import java.time.LocalDateTime;

public class ForumThreadResponseDto {
    private Long id;
    private String title;
    private String content;
    private ForumThread.ThreadTag tag;
    private String authorId;
    private String authorName;
    private Long moduleId;
    private String moduleName;
    private Long viewCount;
    private Long upvoteCount;
    private int postCount;
    private boolean hasSolution;
    private Boolean isClosed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ForumThreadResponseDto() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public ForumThread.ThreadTag getTag() { return tag; }
    public void setTag(ForumThread.ThreadTag tag) { this.tag = tag; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }

    public Long getViewCount() { return viewCount; }
    public void setViewCount(Long viewCount) { this.viewCount = viewCount; }

    public Long getUpvoteCount() { return upvoteCount; }
    public void setUpvoteCount(Long upvoteCount) { this.upvoteCount = upvoteCount; }

    public int getPostCount() { return postCount; }
    public void setPostCount(int postCount) { this.postCount = postCount; }

    public boolean isHasSolution() { return hasSolution; }
    public void setHasSolution(boolean hasSolution) { this.hasSolution = hasSolution; }

    public Boolean getIsClosed() { return isClosed; }
    public void setIsClosed(Boolean isClosed) { this.isClosed = isClosed; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static ForumThreadResponseDto fromEntity(ForumThread t) {
        ForumThreadResponseDto dto = new ForumThreadResponseDto();
        dto.setId(t.getId());
        dto.setTitle(t.getTitle());
        dto.setContent(t.getContent());
        dto.setTag(t.getTag());
        dto.setAuthorId(t.getAuthorId());
        dto.setAuthorName(t.getAuthorName());
        // Use moduleId directly instead of accessing module relationship
        dto.setModuleId(t.getModuleId());
        dto.setModuleName(""); // Module name would require fetching module, skip for now
        dto.setViewCount(t.getViewCount());
        dto.setUpvoteCount(t.getUpvoteCount());
        // Check if posts are initialized to get accurate count
        if (t.getPosts() != null && !t.getPosts().isEmpty()) {
            dto.setPostCount(t.getPosts().size());
            dto.setHasSolution(t.getPosts().stream().anyMatch(p -> Boolean.TRUE.equals(p.getIsSolution())));
        } else {
            dto.setPostCount(0);
            dto.setHasSolution(false);
        }
        dto.setIsClosed(t.getIsClosed());
        dto.setCreatedAt(t.getCreatedAt());
        dto.setUpdatedAt(t.getUpdatedAt());
        return dto;
    }
}
