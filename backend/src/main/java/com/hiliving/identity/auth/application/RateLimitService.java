package com.hiliving.identity.auth.application;

import com.hiliving.api.error.ApiRequestException;
import com.hiliving.email.EmailProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class RateLimitService {
    private final Clock clock;
    private final int maximumEntries;
    private final Map<String, Window> windows = new LinkedHashMap<>(256, 0.75f, true);

    public RateLimitService(Clock clock, EmailProperties properties) {
        this.clock = clock;
        this.maximumEntries = properties.rateLimit().maxEntries();
    }

    public synchronized void check(String scope, String key, int limit, Duration duration) {
        Instant now = Instant.now(clock);
        evictExpired(now);
        String cacheKey = scope + ':' + key;
        Window current = windows.get(cacheKey);
        if (current == null || !current.expiresAt().isAfter(now)) {
            ensureCapacity();
            windows.put(cacheKey, new Window(1, now.plus(duration)));
            return;
        }
        if (current.count() >= limit) {
            long retry = Math.max(1, Duration.between(now, current.expiresAt()).toSeconds());
            throw new ApiRequestException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED",
                    "Too many requests. Try again later.", retry);
        }
        windows.put(cacheKey, new Window(current.count() + 1, current.expiresAt()));
    }

    private void evictExpired(Instant now) {
        Iterator<Map.Entry<String, Window>> iterator = windows.entrySet().iterator();
        while (iterator.hasNext()) if (!iterator.next().getValue().expiresAt().isAfter(now)) iterator.remove();
    }

    private void ensureCapacity() {
        while (windows.size() >= maximumEntries) {
            Iterator<String> iterator = windows.keySet().iterator();
            if (!iterator.hasNext()) break;
            iterator.next();
            iterator.remove();
        }
    }

    private record Window(int count, Instant expiresAt) {}
}
