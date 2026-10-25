package com.lms.user.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String username = request.getHeader("loggedInUser");
        String gatewayRole = request.getHeader("loggedInUserRole"); // e.g. "scolarite", "chef_dept", "lecturer"

        if (username != null) {
            // Secure gateway authentication (already cryptographically validated by API Gateway)
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = null;
                try {
                    userDetails = this.userDetailsService.loadUserByUsername(username);
                } catch (Exception ignored) {
                    // User not in local app_users (e.g. SCOLARITE created only in Keycloak) — build transient
                }

                // Build authority from gateway-forwarded role (source of truth = Keycloak)
                if (gatewayRole != null && !gatewayRole.isBlank()) {
                    String springRole = "ROLE_" + gatewayRole.toUpperCase();
                    final String finalUsername = username;

                    // Construct the authority list — administrative lecturer roles inherit ROLE_LECTURER
                    // so they can access all lecturer-protected endpoints without modifying each @PreAuthorize.
                    java.util.List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
                    authorities.add(new SimpleGrantedAuthority(springRole));
                    if ("ROLE_CHEF_DEPT".equals(springRole) || "ROLE_RESP_PEDAGO".equals(springRole)) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_LECTURER"));
                    }

                    // Wrap in a transient UserDetails so @PreAuthorize works correctly
                    UserDetails effective = new org.springframework.security.core.userdetails.User(
                            finalUsername, "", authorities);
                    setAuthentication(request, effective);
                } else if (userDetails != null) {
                    setAuthentication(request, userDetails);
                }
            }
        } else {
            // Legacy direct token authentication fallback (for local development or direct testing)
            final String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String jwt = authHeader.substring(7);
                try {
                    String extractedUsername = jwtService.extractUsername(jwt);
                    if (extractedUsername != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        UserDetails userDetails = this.userDetailsService.loadUserByUsername(extractedUsername);
                        if (jwtService.isTokenValid(jwt, userDetails)) {
                            setAuthentication(request, userDetails);
                        }
                    }
                } catch (Exception e) {
                    logger.warn("Direct JWT token authentication failed: " + e.getMessage());
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private void setAuthentication(HttpServletRequest request, UserDetails userDetails) {
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );
        authToken.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request)
        );
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }
}
