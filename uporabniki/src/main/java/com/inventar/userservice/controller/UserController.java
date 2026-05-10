package com.inventar.userservice.controller;

import com.inventar.userservice.model.Role;
import com.inventar.userservice.model.AuditLog;
import com.inventar.userservice.model.User;
import com.inventar.userservice.service.UserService;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public Mono<User> register(@RequestBody User user) {
        return userService.registerUser(user);
    }

    @PostMapping("/login")
    public Mono<User> login(
            @RequestBody(required = false) Map<String, String> payload,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String password) {
        String effectiveUsername = payload != null && payload.get("username") != null
                ? payload.get("username")
                : username;
        String effectivePassword = payload != null && payload.get("password") != null
                ? payload.get("password")
                : password;

        return userService.login(effectiveUsername, effectivePassword);
    }

    @GetMapping
    public Flux<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public Mono<User> getUserById(@PathVariable String id) {
        return userService.getUserById(id);
    }

    @PutMapping("/{id}/role")
    public Mono<User> updateRole(@PathVariable String id, @RequestParam Role role) {
        return userService.updateUserRole(id, role);
    }

    @DeleteMapping("/{id}")
    public Mono<Void> deleteUser(@PathVariable String id) {
        return userService.deleteUser(id);
    }

    @GetMapping("/audit/logs")
    public Flux<AuditLog> getAuditLogs(@RequestParam(required = false) String action) {
        return userService.getAuditLogs(action);
    }
}
