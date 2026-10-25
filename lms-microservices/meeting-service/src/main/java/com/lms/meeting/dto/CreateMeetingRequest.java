package com.lms.meeting.dto;

import lombok.Data;

@Data
public class CreateMeetingRequest {
    private String title;
    private String description;
}
