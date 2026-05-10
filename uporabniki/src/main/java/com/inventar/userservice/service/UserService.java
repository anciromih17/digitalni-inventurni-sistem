package com.inventar.userservice.service;

import com.inventar.userservice.messaging.UserEventProducer;
import com.inventar.userservice.model.Role;
import com.inventar.userservice.model.User;
import com.inventar.userservice.repository.UserRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserEventProducer userEventProducer;
    private final AuditLogService auditLogService;

    public UserService(UserRepository userRepository, UserEventProducer userEventProducer, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.userEventProducer = userEventProducer;
        this.auditLogService = auditLogService;
    }

    public Mono<User> registerUser(User user) {
        user.setRole(Role.USER);

        return userRepository.save(user)
                .doOnSuccess(savedUser -> {
                    System.out.println("[REGISTER USER] User registered: " + savedUser.getUsername());
                    userEventProducer.sendUserRegisteredEvent(savedUser.getUsername());
                })
                .flatMap(savedUser -> auditLogService.log(
                                "USER_REGISTERED",
                                "user",
                                savedUser.getId(),
                                savedUser.getUsername(),
                                java.util.Map.of(
                                        "email", savedUser.getEmail(),
                                        "role", savedUser.getRole().name()))
                        .thenReturn(savedUser));
    }

    public Mono<User> login(String username, String password) {
        System.out.println("[LOGIN] Attempt login for username: " + username);
        return userRepository.findByUsername(username)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Invalid credentials")))
                .flatMap(user -> {
                    if (password != null && !password.isBlank() && !password.equals(user.getPassword())) {
                        return Mono.error(new IllegalArgumentException("Invalid credentials"));
                    }

                    return auditLogService.log(
                                    "USER_LOGGED_IN",
                                    "user",
                                    user.getId(),
                                    user.getUsername(),
                                    java.util.Map.of("role", user.getRole().name()))
                            .thenReturn(user);
                });
    }

    public Flux<User> getAllUsers() {
        System.out.println("[GET ALL USERS] Request received");
        return userRepository.findAll();
    }

    public Mono<User> getUserById(String id) {
        System.out.println("[GET USER BY ID] id=" + id);
        return userRepository.findById(id);
    }

    public Mono<User> updateUserRole(String id, Role role) {
        System.out.println("[UPDATE USER ROLE] id=" + id + ", role=" + role);

        return userRepository.findById(id)
                .flatMap(user -> {
                    user.setRole(role);
                    return userRepository.save(user)
                            .doOnSuccess(updatedUser -> {
                                System.out.println(
                                        "[UPDATE USER ROLE] Role updated for user: " + updatedUser.getUsername());
                                userEventProducer.sendUserRoleChangedEvent(updatedUser.getUsername(),
                                        updatedUser.getRole().name());
                            })
                            .flatMap(updatedUser -> auditLogService.log(
                                            "USER_ROLE_UPDATED",
                                            "user",
                                            updatedUser.getId(),
                                            updatedUser.getUsername(),
                                            java.util.Map.of("role", updatedUser.getRole().name()))
                                    .thenReturn(updatedUser));
                });
    }

    public Mono<Void> deleteUser(String id) {
        System.out.println("[DELETE USER] id=" + id);
        return userRepository.findById(id)
                .flatMap(user -> userRepository.deleteById(id)
                        .then(auditLogService.log(
                                "USER_DELETED",
                                "user",
                                user.getId(),
                                user.getUsername(),
                                java.util.Map.of(
                                        "email", user.getEmail(),
                                        "role", user.getRole().name())))
                        .then());
    }

    public Flux<com.inventar.userservice.model.AuditLog> getAuditLogs(String action) {
        return auditLogService.getAuditLogs(action);
    }
}
