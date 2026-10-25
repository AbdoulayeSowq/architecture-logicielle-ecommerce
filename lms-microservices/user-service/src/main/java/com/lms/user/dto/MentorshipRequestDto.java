package com.lms.user.dto;

import lombok.Data;

@Data
public class MentorshipRequestDto {
    private String mentorUsername;
    private String menteeUsername;
    private Long moduleId;
    private String mentorRole; // LECTURER | STUDENT
}
