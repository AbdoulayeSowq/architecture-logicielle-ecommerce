package com.lms.ai.dto;

import lombok.Data;

@Data
public class ChatRequest {
    private String prompt;
    private Long moduleId;
    private String context; // Optional: raw text content if already extracted
}
