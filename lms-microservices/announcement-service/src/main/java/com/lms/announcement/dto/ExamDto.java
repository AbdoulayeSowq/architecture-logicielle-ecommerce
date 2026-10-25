package com.lms.announcement.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ExamDto extends AnnouncementDto {
    @NotBlank(message = "Course code is required")
    private String examCourseCode;
    
    @Future(message = "Exam date must be in the future")
    private LocalDate examDate;
    
    @NotBlank(message = "Exam time is required")
    private String examTime;
    
    @NotBlank(message = "Exam location is required")
    private String examLocation;
    
    @NotBlank(message = "Exam instructor is required")
    private String examInstructor;
    
    private String examResources;
}