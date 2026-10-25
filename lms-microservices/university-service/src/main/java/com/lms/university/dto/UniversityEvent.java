package com.lms.university.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UniversityEvent {
    private String action; // CREATED, UPDATED, DELETED
    private String type;   // DEPT, CLASS
    private Long id;
    private String name;
    private String code;   // did or clid
}
