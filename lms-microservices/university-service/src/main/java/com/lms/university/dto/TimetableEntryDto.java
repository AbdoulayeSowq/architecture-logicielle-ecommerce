package com.lms.university.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimetableEntryDto {
    private Long id;
    private String dayOfWeek;
    private String startTime;
    private String endTime;
    private String courseName;
    private String teacherName;
    private String type;
    private boolean online;
}
