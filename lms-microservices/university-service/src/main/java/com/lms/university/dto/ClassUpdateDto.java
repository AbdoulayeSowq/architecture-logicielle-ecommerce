package com.lms.university.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassUpdateDto {
    private String name;
    private String description;
    private String phone;
    private String email;
}
