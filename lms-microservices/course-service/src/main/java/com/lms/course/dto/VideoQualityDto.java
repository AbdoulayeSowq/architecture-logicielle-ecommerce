package com.lms.course.dto;

import java.util.Map;

public class VideoQualityDto {
    private String fileName;
    private String originalUrl;
    private Map<String, String> qualities;

    public VideoQualityDto() {}

    public VideoQualityDto(String fileName, String originalUrl, Map<String, String> qualities) {
        this.fileName = fileName;
        this.originalUrl = originalUrl;
        this.qualities = qualities;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getOriginalUrl() {
        return originalUrl;
    }

    public void setOriginalUrl(String originalUrl) {
        this.originalUrl = originalUrl;
    }

    public Map<String, String> getQualities() {
        return qualities;
    }

    public void setQualities(Map<String, String> qualities) {
        this.qualities = qualities;
    }
}
