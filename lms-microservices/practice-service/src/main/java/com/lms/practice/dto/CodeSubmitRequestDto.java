package com.lms.practice.dto;

import jakarta.validation.constraints.NotBlank;

public class CodeSubmitRequestDto {
    @NotBlank(message = "Source code is required")
    private String sourceCode;

    @NotBlank(message = "Language is required")
    private String language;

    public String getSourceCode() { return sourceCode; }
    public void setSourceCode(String sourceCode) { this.sourceCode = sourceCode; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
}
