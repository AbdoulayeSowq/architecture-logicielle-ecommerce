package com.lms.user.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = getClass().getResourceAsStream("/serviceAccount.json");
                
                if (serviceAccount == null) {
                    System.err.println("WARNING: serviceAccount.json not found in classpath. Firebase notifications will not work.");
                    return;
                }

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("Firebase Admin SDK has been initialized.");
            }
        } catch (IOException e) {
            System.err.println("Error initializing Firebase Admin SDK: " + e.getMessage());
        }
    }
}
