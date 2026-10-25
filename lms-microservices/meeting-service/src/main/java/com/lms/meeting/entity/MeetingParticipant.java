package com.lms.meeting.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeetingParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meeting_id", nullable = false)
    private Long meetingId;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @Column(name = "role")
    private String role;

    @PrePersist
    protected void onCreate() {
        this.joinedAt = LocalDateTime.now();
        if (this.role == null) {
            this.role = "PARTICIPANT";
        }
    }
}
