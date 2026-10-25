package com.lms.meeting.controller;

import com.lms.meeting.dto.CreateMeetingRequest;
import com.lms.meeting.dto.JoinMeetingRequest;
import com.lms.meeting.dto.JoinMeetingResponse;
import com.lms.meeting.entity.Meeting;
import com.lms.meeting.entity.MeetingParticipant;
import com.lms.meeting.service.MeetingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meeting")
public class MeetingController {

    private final MeetingService meetingService;

    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @PostMapping("/modules/{moduleId}/meetings")
    public ResponseEntity<Meeting> createMeeting(
            @PathVariable Long moduleId,
            @RequestBody CreateMeetingRequest request,
            @RequestHeader("loggedInUser") String username) {
        Meeting meeting = meetingService.createMeeting(
                moduleId, username, request.getTitle(), request.getDescription()
        );
        return ResponseEntity.ok(meeting);
    }

    @GetMapping("/modules/{moduleId}/meetings")
    public ResponseEntity<List<Meeting>> getModuleMeetings(@PathVariable Long moduleId) {
        return ResponseEntity.ok(meetingService.getModuleMeetings(moduleId));
    }

    @GetMapping("/modules/{moduleId}/meetings/active")
    public ResponseEntity<List<Meeting>> getActiveModuleMeetings(@PathVariable Long moduleId) {
        return ResponseEntity.ok(meetingService.getActiveModuleMeetings(moduleId));
    }

    @GetMapping("/active")
    public ResponseEntity<List<Meeting>> getActiveMeetings(@RequestParam List<Long> moduleIds) {
        return ResponseEntity.ok(meetingService.getActiveMeetingsForModules(moduleIds));
    }

    @PostMapping("/meetings/{id}/join")
    public ResponseEntity<?> joinMeeting(
            @PathVariable Long id,
            @RequestBody JoinMeetingRequest request,
            @RequestHeader("loggedInUser") String username,
            @RequestHeader(value = "loggedInUserFirstName", required = false) String firstName,
            @RequestHeader(value = "loggedInUserLastName", required = false) String lastName,
            @RequestHeader(value = "loggedInUserFullName", required = false) String fullName) {
        Meeting meeting = meetingService.getMeetingById(id);

        if (!"ACTIVE".equals(meeting.getStatus())) {
            return ResponseEntity.badRequest().body("Cette réunion est terminée et ne peut plus être rejointe.");
        }

        String token = meetingService.generateToken(
                meeting.getRoomName(), username, request.getRole(), firstName, lastName, fullName
        );
        MeetingParticipant participant = meetingService.joinMeeting(id, username, request.getRole());

        return ResponseEntity.ok(new JoinMeetingResponse(token, meetingService.getLivekitUrl(), participant));
    }

    @PostMapping("/meetings/{id}/end")
    public ResponseEntity<Void> endMeeting(
            @PathVariable Long id,
            @RequestHeader("loggedInUser") String username) {
        meetingService.endMeeting(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/meetings/{id}/participants")
    public ResponseEntity<List<MeetingParticipant>> getMeetingParticipants(@PathVariable Long id) {
        return ResponseEntity.ok(meetingService.getMeetingParticipants(id));
    }
}
