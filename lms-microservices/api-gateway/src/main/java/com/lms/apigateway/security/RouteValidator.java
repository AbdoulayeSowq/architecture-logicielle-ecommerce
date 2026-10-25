package com.lms.apigateway.security;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Predicate;

@Component
public class RouteValidator {

    public static final List<String> openApiEndpoints = List.of(
            "/api/user/auth/login",
            "/api/user/auth/register",
            "/eureka",
            "/api-docs",
            "/v3/api-docs",
            "/swagger-ui",
            "/swagger-resources",
            "/api/public/", // Any endpoint under /api/public is open
            "/api/course/files/download/", // Downloads accessible without JWT
            "/api/user/contacts",
            "/api/user/student/", // Student lookup by username (used by Navbar, permit-all in user-service)
            "/api/user/lecturer/", // Lecturer lookup by username (used by Lecturer Navbar, permit-all in user-service)
            "/api/ai/", // AI service endpoints accessible without JWT
            "/ws-announcement"
    );

    public Predicate<ServerHttpRequest> isSecured =
            request -> {
                String path = request.getURI().getPath();
                // WebSocket paths are open
                if (path.startsWith("/ws-announcement")) return false;
                return openApiEndpoints
                        .stream()
                        .noneMatch(uri -> path.contains(uri));
            };
}
