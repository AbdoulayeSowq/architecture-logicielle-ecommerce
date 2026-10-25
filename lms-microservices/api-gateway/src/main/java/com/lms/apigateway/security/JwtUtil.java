package com.lms.apigateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.Map;

@Component
public class JwtUtil {

    // Centralized JWK Set URI pointing to Keycloak public certificates
    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:http://keycloak:8080/auth/realms/lms/protocol/openid-connect/certs}")
    private String jwkSetUri;

    private JwtDecoder jwtDecoder;

    @PostConstruct
    public void init() {
        this.jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
    }

    public void validateToken(final String token) {
        // Will validate asymmetric signature, expiry, and issuer. Throws exception if invalid.
        jwtDecoder.decode(token);
    }

    public Claims getClaims(final String token) {
        Jwt jwt = jwtDecoder.decode(token);
        Claims claims = Jwts.claims();
        
        if (jwt != null) {
            // Map preferred_username (or subject UUID fallback) to Jwts subject for absolute backward compatibility
            String username = jwt.getClaimAsString("preferred_username");
            claims.setSubject(username != null ? username : jwt.getSubject());

            // Map Keycloak nested realm roles and resource access roles into traditional flat role string
            StringBuilder rolesBuilder = new StringBuilder();
            
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                rolesBuilder.append(realmAccess.get("roles").toString()).append(" ");
            }
            
            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess != null) {
                rolesBuilder.append(resourceAccess.toString()).append(" ");
            }
            
            String rolesStr = rolesBuilder.toString().toLowerCase();
            String flatRole = "";
            if (rolesStr.contains("admin")) {
                flatRole = "admin";
            } else if (rolesStr.contains("scolarite")) {
                flatRole = "scolarite";
            } else if (rolesStr.contains("chef_dept")) {
                flatRole = "chef_dept";
            } else if (rolesStr.contains("resp_pedago")) {
                flatRole = "resp_pedago";
            } else if (rolesStr.contains("lecturer") || rolesStr.contains("teacher")) {
                flatRole = "lecturer";
            } else if (rolesStr.contains("student")) {
                flatRole = "student";
            }
            claims.put("role", flatRole);
            
            // Map name claims from Keycloak JWT token to Jwts Claims
            String firstName = jwt.getClaimAsString("given_name");
            if (firstName == null) firstName = jwt.getClaimAsString("firstName");
            claims.put("given_name", firstName != null ? firstName : "");

            String lastName = jwt.getClaimAsString("family_name");
            if (lastName == null) lastName = jwt.getClaimAsString("lastName");
            claims.put("family_name", lastName != null ? lastName : "");

            String fullName = jwt.getClaimAsString("name");
            if (fullName == null) fullName = jwt.getClaimAsString("fullName");
            claims.put("name", fullName != null ? fullName : "");
        }
        
        return claims;
    }
}
