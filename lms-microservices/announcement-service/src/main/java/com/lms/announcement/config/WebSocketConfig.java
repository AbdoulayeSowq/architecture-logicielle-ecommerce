package com.lms.announcement.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Active un broker simple en mémoire pour les destinations préfixées par /topic et /queue
        config.enableSimpleBroker("/topic", "/queue");

        // Préfixe pour les messages envoyés depuis le client vers les méthodes @MessageMapping
        config.setApplicationDestinationPrefixes("/app");

        // Préfixe pour les messages destinés à un utilisateur spécifique (/user/{username}/queue/...)
        config.setUserDestinationPrefix("/user");

    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint natif STOMP/WebSocket pour clients mobiles (stomp_dart_client, iOS/Android natifs).
        // Pas de SockJS framing — STOMP brut over WebSocket.
        registry.addEndpoint("/ws-stomp")
                .setAllowedOriginPatterns("*");

        // Endpoint SockJS pour clients web (fallback long-polling si WebSocket bloqué).
        registry.addEndpoint("/ws-announcement")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(org.springframework.messaging.simp.config.ChannelRegistration registration) {
        registration.interceptors(new org.springframework.messaging.support.ChannelInterceptor() {
            @Override
            public org.springframework.messaging.Message<?> preSend(org.springframework.messaging.Message<?> message, org.springframework.messaging.MessageChannel channel) {
                org.springframework.messaging.simp.stomp.StompHeaderAccessor accessor =
                        org.springframework.messaging.support.MessageHeaderAccessor.getAccessor(message, org.springframework.messaging.simp.stomp.StompHeaderAccessor.class);
                if (accessor != null && org.springframework.messaging.simp.stomp.StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String username = accessor.getFirstNativeHeader("username");
                    if (username != null && !username.isEmpty()) {
                        accessor.setUser(new java.security.Principal() {
                            @Override
                            public String getName() {
                                return username;
                            }
                        });
                    }
                }
                return message;
            }
        });
    }
}
