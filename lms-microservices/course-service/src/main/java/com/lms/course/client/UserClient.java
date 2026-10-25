package com.lms.course.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.time.LocalDateTime;

@FeignClient(name = "user-service")
public interface UserClient {

    @GetMapping("/api/user/activity/{username}")
    UserActivityDTO getUserActivity(@PathVariable("username") String username);

    @GetMapping("/api/user/student/level/{level}")
    java.util.List<StudentDTO> getStudentsByLevel(@PathVariable("level") String level);

    @GetMapping("/api/user/student/{username}/username")
    StudentDTO getStudentByUsername(@PathVariable("username") String username);

    @GetMapping("/api/user/lecturer/{username}/username")
    LecturerDTO getLecturerByUsername(@PathVariable("username") String username);

    @org.springframework.web.bind.annotation.PostMapping("/api/user/analytics/student/{username}/session-result")
    void updateAdaptiveProfileFromSession(
            @PathVariable("username") String username,
            @org.springframework.web.bind.annotation.RequestBody SessionResultPayload payload);

    @org.springframework.web.bind.annotation.PostMapping("/api/user/notifications/send-to-level")
    void sendNotificationToLevel(@org.springframework.web.bind.annotation.RequestBody LevelNotificationRequest request);

    class LevelNotificationRequest {
        private String level;
        private String title;
        private String body;

        public LevelNotificationRequest() {}
        public LevelNotificationRequest(String level, String title, String body) {
            this.level = level;
            this.title = title;
            this.body = body;
        }
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getBody() { return body; }
        public void setBody(String body) { this.body = body; }
    }

    class SessionResultPayload {
        private java.util.Map<String, Double> competenceScores;
        private Double scorePercent;

        public SessionResultPayload() {}
        public SessionResultPayload(java.util.Map<String, Double> competenceScores, Double scorePercent) {
            this.competenceScores = competenceScores;
            this.scorePercent = scorePercent;
        }
        public java.util.Map<String, Double> getCompetenceScores() { return competenceScores; }
        public void setCompetenceScores(java.util.Map<String, Double> competenceScores) { this.competenceScores = competenceScores; }
        public Double getScorePercent() { return scorePercent; }
        public void setScorePercent(Double scorePercent) { this.scorePercent = scorePercent; }
    }

    class StudentDTO {
        private String username;
        private String fullName;
        private String email;
        private String level; // Added level

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
    }

    class LecturerDTO {
        private String username;
        private String fullName;
        private String firstName;
        private String lastName;
        private String email;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    class UserActivityDTO {
        private String username;
        private LocalDateTime lastLoginDate;
        private String role;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public LocalDateTime getLastLoginDate() { return lastLoginDate; }
        public void setLastLoginDate(LocalDateTime lastLoginDate) { this.lastLoginDate = lastLoginDate; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }
}
