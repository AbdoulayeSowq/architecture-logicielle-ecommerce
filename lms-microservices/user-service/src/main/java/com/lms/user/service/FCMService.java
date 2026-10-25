package com.lms.user.service;

import com.google.firebase.messaging.*;
import com.lms.user.entity.UserDeviceToken;
import com.lms.user.repository.UserDeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FCMService {

    private final UserDeviceTokenRepository tokenRepository;

    public void sendNotificationToUser(String username, String title, String body) {
        List<UserDeviceToken> tokens = tokenRepository.findByUsername(username);
        sendToTokens(tokens, username, title, body);
    }

    public void sendNotificationToUsernames(List<String> usernames, String title, String body) {
        List<UserDeviceToken> tokens = tokenRepository.findByUsernameIn(usernames);
        sendToTokens(tokens, "multiple users", title, body);
    }

    private void sendToTokens(List<UserDeviceToken> tokens, String context, String title, String body) {
        if (tokens.isEmpty()) {
            log.warn("No FCM tokens found for: {}", context);
            return;
        }

        for (UserDeviceToken deviceToken : tokens) {
            try {
                Message message = Message.builder()
                        .setToken(deviceToken.getToken())
                        .setNotification(Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .build();

                String response = FirebaseMessaging.getInstance().send(message);
                log.info("Successfully sent message to {} (token: {}): {}", deviceToken.getUsername(), deviceToken.getToken(), response);
            } catch (FirebaseMessagingException e) {
                log.error("Error sending FCM message to user {}: {}", deviceToken.getUsername(), e.getMessage());
                if ("registration-token-not-registered".equals(e.getErrorCode().name().toLowerCase())) {
                    tokenRepository.delete(deviceToken);
                    log.info("Deleted invalid token for user: {}", deviceToken.getUsername());
                }
            }
        }
    }
}
