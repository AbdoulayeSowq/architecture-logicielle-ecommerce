package com.lms.meeting.service;

import com.lms.meeting.entity.Meeting;
import com.lms.meeting.entity.MeetingParticipant;
import com.lms.meeting.repository.MeetingRepository;
import com.lms.meeting.repository.MeetingParticipantRepository;
import io.livekit.server.AccessToken;
import io.livekit.server.CanPublish;
import io.livekit.server.CanPublishData;
import io.livekit.server.CanSubscribe;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class MeetingService {

    @Value("${livekit.api.key:devkey}")
    private String livekitApiKey;

    @Value("${livekit.api.secret:devsecret123456789012345678901234567890}")
    private String livekitApiSecret;

    @Value("${livekit.server.url:ws://localhost:7880}")
    private String livekitServerUrl;

    @Value("${livekit.public.url:}")
    private String livekitPublicUrl;

    private final MeetingRepository meetingRepository;
    private final MeetingParticipantRepository participantRepository;
    private final RestTemplate restTemplate;

    public MeetingService(MeetingRepository meetingRepository,
                          MeetingParticipantRepository participantRepository,
                          RestTemplate restTemplate) {
        this.meetingRepository = meetingRepository;
        this.participantRepository = participantRepository;
        this.restTemplate = restTemplate;
    }

    public Meeting createMeeting(Long moduleId, String createdBy, String title, String description) {
        String roomName = "module-" + moduleId + "-" + UUID.randomUUID().toString().substring(0, 8);

        Meeting meeting = new Meeting();
        meeting.setModuleId(moduleId);
        meeting.setRoomName(roomName);
        meeting.setCreatedBy(createdBy);
        meeting.setTitle(title);
        meeting.setDescription(description);
        meeting.setStatus("ACTIVE");

        Meeting saved = meetingRepository.save(meeting);

        // Fire-and-forget: broadcast STOMP event via announcement-service (non-bloquant)
        CompletableFuture.runAsync(() -> {
            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("id", saved.getId());
                payload.put("moduleId", saved.getModuleId());
                payload.put("roomName", saved.getRoomName());
                payload.put("createdBy", saved.getCreatedBy());
                payload.put("title", saved.getTitle());
                payload.put("description", saved.getDescription());
                payload.put("status", saved.getStatus());
                payload.put("createdAt", saved.getCreatedAt() != null ? saved.getCreatedAt().toString() : "");
                restTemplate.postForEntity(
                    "http://announcement-service/api/announcement/notifications/events/module/" + moduleId + "/meeting-started",
                    payload,
                    Void.class
                );
            } catch (Exception e) {
                // Non-bloquant: la création du meeting réussit même si le broadcast échoue
            }
        });

        return saved;
    }

    public List<Meeting> getModuleMeetings(Long moduleId) {
        return meetingRepository.findByModuleId(moduleId);
    }

    public List<Meeting> getActiveModuleMeetings(Long moduleId) {
        return meetingRepository.findByModuleIdAndStatus(moduleId, "ACTIVE");
    }

    public List<Meeting> getActiveMeetingsForModules(List<Long> moduleIds) {
        if (moduleIds == null || moduleIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return meetingRepository.findByModuleIdInAndStatus(moduleIds, "ACTIVE");
    }

    public String generateToken(String roomName, String username, String role, String firstName, String lastName, String fullName) {
        AccessToken token = new AccessToken(livekitApiKey, livekitApiSecret);
        
        String displayName = username;
        if (firstName != null && !firstName.trim().isEmpty() && lastName != null && !lastName.trim().isEmpty()) {
            // Rendre le nom 100% standardisé : Prénom NOM (ex: Medoune DIOP)
            displayName = firstName.trim() + " " + lastName.trim().toUpperCase();
        } else if (fullName != null && !fullName.trim().isEmpty()) {
            displayName = fullName.trim();
        }

        token.setName(displayName);
        token.setIdentity(username);
        token.addGrants(new RoomJoin(true), new RoomName(roomName), new CanPublish(true), new CanSubscribe(true), new CanPublishData(true));

        return token.toJwt();
    }

    public String getLivekitUrl() {
        return (livekitPublicUrl != null && !livekitPublicUrl.isEmpty())
                ? livekitPublicUrl
                : livekitServerUrl;
    }

    public MeetingParticipant joinMeeting(Long meetingId, String username, String role) {
        MeetingParticipant participant = new MeetingParticipant();
        participant.setMeetingId(meetingId);
        participant.setUsername(username);
        participant.setRole(role);

        return participantRepository.save(participant);
    }

    public void endMeeting(Long meetingId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        meeting.setStatus("ENDED");
        Meeting saved = meetingRepository.save(meeting);

        CompletableFuture.runAsync(() -> {
            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("id", saved.getId());
                payload.put("moduleId", saved.getModuleId());
                payload.put("roomName", saved.getRoomName());
                restTemplate.postForEntity(
                    "http://announcement-service/api/announcement/notifications/events/module/" + saved.getModuleId() + "/meeting-ended",
                    payload,
                    Void.class
                );
            } catch (Exception e) {
                // Non-bloquant
            }
        });
    }

    public Meeting getMeetingById(Long id) {
        return meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));
    }

    public List<MeetingParticipant> getMeetingParticipants(Long meetingId) {
        return participantRepository.findByMeetingId(meetingId);
    }
}
