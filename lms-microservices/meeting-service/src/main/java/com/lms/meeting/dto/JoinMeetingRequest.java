package com.lms.meeting.dto;

import lombok.Data;

@Data
public class JoinMeetingRequest {
    private String roomName;
    private String role;
}
