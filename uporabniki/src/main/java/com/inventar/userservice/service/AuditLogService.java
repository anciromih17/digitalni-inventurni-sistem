package com.inventar.userservice.service;

import com.inventar.userservice.model.AuditLog;
import com.inventar.userservice.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public Mono<AuditLog> log(String action, String entityType, String entityId, String actor, Map<String, Object> details) {
        AuditLog auditLog = new AuditLog(
                "users-service",
                entityType,
                entityId,
                action,
                actor == null ? "system" : actor,
                details,
                Instant.now()
        );

        return auditLogRepository.save(auditLog);
    }

    public Flux<AuditLog> getAuditLogs(String action) {
        if (action != null && !action.isBlank()) {
            return auditLogRepository.findByActionOrderByCreatedAtDesc(action);
        }

        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }
}
