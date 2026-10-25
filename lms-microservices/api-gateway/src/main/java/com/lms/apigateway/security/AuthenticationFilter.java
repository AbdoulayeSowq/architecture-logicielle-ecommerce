package com.lms.apigateway.security;

import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    @Autowired
    private RouteValidator validator;

    @Autowired
    private JwtUtil jwtUtil;

    public AuthenticationFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return ((exchange, chain) -> {
            if (validator.isSecured.test(exchange.getRequest())) {
                // Check if the header contains a token
                if (!exchange.getRequest().getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                }

                String authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION).get(0);
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    authHeader = authHeader.substring(7);
                } else {
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                }

                try {
                    // Validate token
                    jwtUtil.validateToken(authHeader);

                    // Extract claims and add to header for downstream services
                    Claims claims = jwtUtil.getClaims(authHeader);
                    String role = claims.get("role", String.class);
                    
                    String firstName = claims.get("given_name", String.class);
                    if (firstName == null) firstName = claims.get("firstName", String.class);
                    
                    String lastName = claims.get("family_name", String.class);
                    if (lastName == null) lastName = claims.get("lastName", String.class);
                    
                    String fullName = claims.get("name", String.class);
                    if (fullName == null) fullName = claims.get("fullName", String.class);
                    
                    // Mutate the exchange with the new headers
                    // X-User-Username is injected from the validated JWT so downstream services
                    // can trust it — it cannot be forged by the client.
                    return chain.filter(exchange.mutate().request(exchange.getRequest().mutate()
                            .header("loggedInUser", claims.getSubject())
                            .header("X-User-Username", claims.getSubject())
                            .header("loggedInUserRole", role != null ? role : "")
                            .header("loggedInUserFirstName", firstName != null ? firstName : "")
                            .header("loggedInUserLastName", lastName != null ? lastName : "")
                            .header("loggedInUserFullName", fullName != null ? fullName : "")
                            .build()).build());

                } catch (Exception e) {
                    System.out.println("Invalid access... " + e.getMessage());
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                }
            }
            return chain.filter(exchange);
        });
    }

    public static class Config {
        // Configuration properties can go here if needed
    }
}
