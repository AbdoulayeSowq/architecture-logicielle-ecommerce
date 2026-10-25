package com.lms.course.dto;

public class CourseUpdateDto {
    private String title;
    private String description;
    private String lecturer;
    private Long duration; // Duration in hours
    private String level;
    private String language;
    private String format; // Can be 'online', 'in-person', or 'hybrid'
    private Long credits;

    public CourseUpdateDto() {}

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLecturer() { return lecturer; }
    public void setLecturer(String lecturer) { this.lecturer = lecturer; }

    public Long getDuration() { return duration; }
    public void setDuration(Long duration) { this.duration = duration; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public Long getCredits() { return credits; }
    public void setCredits(Long credits) { this.credits = credits; }
}