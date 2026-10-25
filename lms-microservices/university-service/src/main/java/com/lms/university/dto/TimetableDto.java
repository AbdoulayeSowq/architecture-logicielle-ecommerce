package com.lms.university.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimetableDto {
    private Long id;
    private String classId;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean published;
    private List<TimetableEntryDto> entries;
}
