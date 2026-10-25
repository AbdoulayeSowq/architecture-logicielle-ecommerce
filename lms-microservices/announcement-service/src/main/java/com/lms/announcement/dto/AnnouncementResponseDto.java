package com.lms.announcement.dto;

import com.lms.announcement.entity.TargetAudience;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AnnouncementResponseDto {
    private Long id;
    private String title;
    private String description;
    private String type;
    private TargetAudience targetAudience;
    private String targetId;
    private LocalDateTime createdDate;

    // Fields for Assignments
    private String assignmentCourseCode;
    private java.time.LocalDate assignmentDueDate;
    private String assignmentInstructor;

    // Fields for Exams
    private String examCourseCode;
    private java.time.LocalDate examDate;
    private String examTime;
    private String examLocation;
    private String examInstructor;

    // Fields for Events
    private java.time.LocalDate eventDate;
    private String eventTime;
    private String eventLocation;

    // Fields for Maintenance
    private java.time.LocalDateTime maintenanceStart;
    private java.time.LocalDateTime maintenanceEnd;
}

