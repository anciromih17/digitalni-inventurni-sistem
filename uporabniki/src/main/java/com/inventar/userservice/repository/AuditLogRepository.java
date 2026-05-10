package com.inventar.userservice.repository;

import com.inventar.userservice.model.AuditLog;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;

public interface AuditLogRepository extends ReactiveMongoRepository<AuditLog, String> {
    Flux<AuditLog> findByActionOrderByCreatedAtDesc(String action);
    Flux<AuditLog> findAllByOrderByCreatedAtDesc();
}
