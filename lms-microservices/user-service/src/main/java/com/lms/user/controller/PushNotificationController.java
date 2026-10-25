package com.lms.user.controller;

import com.lms.user.entity.Student;
import com.lms.user.entity.UserDeviceToken;
import com.lms.user.repository.UserDeviceTokenRepository;
import com.lms.user.service.AdminService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user/notifications")
@RequiredArgsConstructor
public class PushNotificationController {

    private final UserDeviceTokenRepository tokenRepository;
    private final com.lms.user.service.FCMService fcmService;
    private final AdminService adminService;

    @PostMapping("/token")
    public ResponseEntity<String> registerToken(@RequestBody TokenRequest request) {
        var existingToken = tokenRepository.findByToken(request.getToken());
        
        UserDeviceToken deviceToken = existingToken.orElse(new UserDeviceToken());
        deviceToken.setUsername(request.getUsername());
        deviceToken.setToken(request.getToken());
        deviceToken.setDeviceType(request.getDeviceType());
        
        tokenRepository.save(deviceToken);
        return ResponseEntity.ok("Token registered successfully");
    }

    @PostMapping("/send")
    public ResponseEntity<String> sendNotification(@RequestBody NotificationRequest request) {
        fcmService.sendNotificationToUser(request.getUsername(), request.getTitle(), request.getBody());
        return ResponseEntity.ok("Notification request processed");
    }

    @PostMapping("/send-to-level")
    public ResponseEntity<String> sendNotificationToLevel(@RequestBody LevelNotificationRequest request) {
        List<Student> students = adminService.getStudentsByLevel(request.getLevel());
        List<String> usernames = students.stream()
                .map(Student::getUsername)
                .collect(Collectors.toList());
        
        fcmService.sendNotificationToUsernames(usernames, request.getTitle(), request.getBody());
        return ResponseEntity.ok("Notification request processed for level: " + request.getLevel());
    }

    @GetMapping("/tokens/{username}")
    public ResponseEntity<?> getTokens(@PathVariable String username) {
        return ResponseEntity.ok(tokenRepository.findByUsername(username));
    }

    @Data
    public static class TokenRequest {
        private String username;
        private String token;
        private String deviceType;
    }

    @Data
    public static class NotificationRequest {
        private String username;
        private String title;
        private String body;
    }

    @Data
    public static class LevelNotificationRequest {
        private String level;
        private String title;
        private String body;
    }
}
