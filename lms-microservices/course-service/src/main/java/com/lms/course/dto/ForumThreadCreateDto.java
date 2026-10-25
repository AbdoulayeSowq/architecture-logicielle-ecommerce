package com.lms.course.dto;

public class ForumThreadCreateDto {
    private String title;
    private String content;
    private String authorId;
    private String authorName;
    private Long moduleId;
    private com.lms.course.entity.ForumThread.ThreadTag tag;

    public ForumThreadCreateDto() {}

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public Long getModuleId() { return moduleId; }
    public void setModuleId(Long moduleId) { this.moduleId = moduleId; }

    public com.lms.course.entity.ForumThread.ThreadTag getTag() { return tag; }
    public void setTag(com.lms.course.entity.ForumThread.ThreadTag tag) { this.tag = tag; }
}
