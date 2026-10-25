package com.lms.course.dto;

import com.lms.course.entity.ForumThread;
import com.lms.course.entity.ForumPost;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class ForumThreadDetailDto {
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
    private Boolean isClosed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long solutionPostId;
    private Boolean isUpvoted;
    private List<PostDto> posts;

    public ForumThreadDetailDto() {}

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

    public Boolean getIsClosed() { return isClosed; }
    public void setIsClosed(Boolean isClosed) { this.isClosed = isClosed; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Long getSolutionPostId() { return solutionPostId; }
    public void setSolutionPostId(Long solutionPostId) { this.solutionPostId = solutionPostId; }

    public Boolean getIsUpvoted() { return isUpvoted; }
    public void setIsUpvoted(Boolean isUpvoted) { this.isUpvoted = isUpvoted; }

    public List<PostDto> getPosts() { return posts; }
    public void setPosts(List<PostDto> posts) { this.posts = posts; }

    public static ForumThreadDetailDto fromEntity(ForumThread t) {
        ForumThreadDetailDto dto = new ForumThreadDetailDto();
        dto.setId(t.getId());
        dto.setTitle(t.getTitle());
        dto.setContent(t.getContent());
        dto.setTag(t.getTag());
        dto.setAuthorId(t.getAuthorId());
        dto.setAuthorName(t.getAuthorName());
        if (t.getModule() != null) {
            dto.setModuleId(t.getModule().getId());
            dto.setModuleName(t.getModule().getName());
        }
        dto.setViewCount(t.getViewCount());
        dto.setUpvoteCount(t.getUpvoteCount());
        dto.setIsClosed(t.getIsClosed());
        dto.setCreatedAt(t.getCreatedAt());
        dto.setUpdatedAt(t.getUpdatedAt());
        dto.setSolutionPostId(t.getSolution() != null ? t.getSolution().getId() : null);
        if (t.getPosts() != null) {
            dto.setPosts(t.getPosts().stream()
                    .filter(p -> p.getParentPost() == null)
                    .map(PostDto::fromEntity)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    // Nested Post DTO
    public static class PostDto {
        private Long id;
        private String content;
        private String authorId;
        private String authorName;
        private Long upvoteCount;
        private Boolean isSolution;
        private Boolean isEdited;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Boolean isUpvoted;
        private List<PostDto> replies;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public String getAuthorId() { return authorId; }
        public void setAuthorId(String authorId) { this.authorId = authorId; }
        public String getAuthorName() { return authorName; }
        public void setAuthorName(String authorName) { this.authorName = authorName; }
        public Long getUpvoteCount() { return upvoteCount; }
        public void setUpvoteCount(Long upvoteCount) { this.upvoteCount = upvoteCount; }
        public Boolean getIsSolution() { return isSolution; }
        public void setIsSolution(Boolean isSolution) { this.isSolution = isSolution; }
        public Boolean getIsEdited() { return isEdited; }
        public void setIsEdited(Boolean isEdited) { this.isEdited = isEdited; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
        public List<PostDto> getReplies() { return replies; }
        public void setReplies(List<PostDto> replies) { this.replies = replies; }

        public Boolean getIsUpvoted() { return isUpvoted; }
        public void setIsUpvoted(Boolean isUpvoted) { this.isUpvoted = isUpvoted; }

        public static PostDto fromEntity(ForumPost p) {
            PostDto dto = new PostDto();
            dto.setId(p.getId());
            dto.setContent(p.getContent());
            dto.setAuthorId(p.getAuthorId());
            dto.setAuthorName(p.getAuthorName());
            dto.setUpvoteCount(p.getUpvoteCount());
            dto.setIsSolution(p.getIsSolution());
            dto.setIsEdited(p.getIsEdited());
            dto.setCreatedAt(p.getCreatedAt());
            dto.setUpdatedAt(p.getUpdatedAt());
            if (p.getReplies() != null && !p.getReplies().isEmpty()) {
                dto.setReplies(p.getReplies().stream()
                        .map(PostDto::fromEntity)
                        .collect(Collectors.toList()));
            }
            return dto;
        }
    }
}
