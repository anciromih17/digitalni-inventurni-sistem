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

    public UserService(UserRepository userRepository, UserEventProducer userEventProducer) {
        this.userRepository = userRepository;
        this.userEventProducer = userEventProducer;
    }

    public Mono<User> registerUser(User user) {
        user.setRole(Role.USER);

        return userRepository.save(user)
                .doOnSuccess(savedUser -> {
                    System.out.println("[REGISTER USER] User registered: " + savedUser.getUsername());
                    userEventProducer.sendUserRegisteredEvent(savedUser.getUsername());
                });
    }

    public Mono<User> login(String username) {
        System.out.println("[LOGIN] Attempt login for username: " + username);
        return userRepository.findByUsername(username);
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
                            });
                });
    }

    public Mono<Void> deleteUser(String id) {
        System.out.println("[DELETE USER] id=" + id);
        return userRepository.deleteById(id);
    }
}