package ru.redcode.poster.server.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import ru.redcode.poster.server.model.CustomUserDetails;
import ru.redcode.poster.server.model.User;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
@Component
public class TokenManager {

    @Value("${jwt.secret}")
    private String jwtSecret;

    public static final long TOKEN_VALIDITY = 10 * 60 * 60;

    public String generateJwtTokenFromUserDetails(CustomUserDetails userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .claim("userId", userDetails.getId())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + TOKEN_VALIDITY * 1000)) // 10 часов
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        Object userId = claims.get("userId");
        return userId == null ? null : Long.valueOf(userId.toString());
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    public Boolean validateJwtToken(String token, UserDetails userDetails) {
        String username = getUsernameFromToken(token);
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return (username.equals(userDetails.getUsername()) && !claims.getExpiration().before(new Date()));
    }

    private Key getKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
