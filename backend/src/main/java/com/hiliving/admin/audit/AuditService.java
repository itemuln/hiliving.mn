package com.hiliving.admin.audit;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    private final AuditLogRepository logs;
    public AuditService(AuditLogRepository logs) { this.logs = logs; }
    public void record(String action, String entityType, Long entityId, String details) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String actor = authentication == null ? "system" : authentication.getName();
        logs.save(new AuditLogEntity(actor, action, entityType, entityId, sanitize(details)));
    }
    private String sanitize(String details) {
        if (details == null) return null;
        return details.substring(0, Math.min(details.length(), 1000));
    }
}
