package com.inventar.userservice.controller;

import com.inventar.userservice.model.Role;
import com.inventar.userservice.model.User;
import com.inventar.userservice.service.UserService;
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
    public Mono<User> login(@RequestParam String username) {
        return userService.login(username);
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
}