package com.lms.meeting.dto;

import com.lms.meeting.entity.MeetingParticipant;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JoinMeetingResponse {
    private String token;
    private String livekitUrl;
    private MeetingParticipant participant;
}
