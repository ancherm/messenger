package ru.redcode.poster.server.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import ru.redcode.poster.server.jwt.TokenManager;

import java.util.List;
import java.util.Map;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@RequiredArgsConstructor
public class StompPrincipalChannelInterceptor implements ChannelInterceptor {

    private final TokenManager tokenManager;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null) {
            Object u = sessionAttributes.get(JwtHandshakeInterceptor.SESSION_USER);
            if (u instanceof UserDetails ud) {
                setAuth(accessor, ud);
                return message;
            }
        }
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String header = authHeaders.get(0);
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7).trim();
                try {
                    String username = tokenManager.getUsernameFromToken(token);
                    UserDetails ud = userDetailsService.loadUserByUsername(username);
                    if (Boolean.TRUE.equals(tokenManager.validateJwtToken(token, ud))) {
                        setAuth(accessor, ud);
                        if (sessionAttributes != null) {
                            sessionAttributes.put(JwtHandshakeInterceptor.SESSION_USER, ud);
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }
        return message;
    }

    private static void setAuth(StompHeaderAccessor accessor, UserDetails ud) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
        accessor.setUser(auth);
    }
}
