package com.inventar.userservice;

import com.inventar.userservice.controller.UserController;
import com.inventar.userservice.model.Role;
import com.inventar.userservice.model.User;
import com.inventar.userservice.service.UserService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@WebFluxTest(UserController.class)
public class UserControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private UserService userService;

    @Test
    void testRegisterUser() {
        User user = new User();
        user.setId("1");
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("123");
        user.setRole(Role.USER);

        Mockito.when(userService.registerUser(Mockito.any(User.class)))
                .thenReturn(Mono.just(user));

        webTestClient.post()
                .uri("/api/users/register")
                .bodyValue(user)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.username").isEqualTo("testuser")
                .jsonPath("$.role").isEqualTo("USER");
    }

    @Test
    void testLoginUser() {
        User user = new User();
        user.setId("1");
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("123");
        user.setRole(Role.USER);

        Mockito.when(userService.login("testuser", "123"))
                .thenReturn(Mono.just(user));

        webTestClient.post()
                .uri("/api/users/login")
                .bodyValue(java.util.Map.of("username", "testuser", "password", "123"))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.username").isEqualTo("testuser");
    }

    @Test
    void testGetAllUsers() {
        User user1 = new User("1", "ana", "ana@example.com", "123", Role.USER);
        User user2 = new User("2", "admin", "admin@example.com", "123", Role.ADMIN);

        Mockito.when(userService.getAllUsers())
                .thenReturn(Flux.just(user1, user2));

        webTestClient.get()
                .uri("/api/users")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$[0].username").isEqualTo("ana")
                .jsonPath("$[1].username").isEqualTo("admin");
    }

    @Test
    void testGetUserById() {
        User user = new User("1", "ana", "ana@example.com", "123", Role.USER);

        Mockito.when(userService.getUserById("1"))
                .thenReturn(Mono.just(user));

        webTestClient.get()
                .uri("/api/users/1")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.id").isEqualTo("1")
                .jsonPath("$.username").isEqualTo("ana");
    }

    @Test
    void testUpdateUserRole() {
        User user = new User("1", "ana", "ana@example.com", "123", Role.ADMIN);

        Mockito.when(userService.updateUserRole("1", Role.ADMIN))
                .thenReturn(Mono.just(user));

        webTestClient.put()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/users/1/role")
                        .queryParam("role", "ADMIN")
                        .build())
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.role").isEqualTo("ADMIN");
    }

    @Test
    void testDeleteUser() {
        Mockito.when(userService.deleteUser("1"))
                .thenReturn(Mono.empty());

        webTestClient.delete()
                .uri("/api/users/1")
                .exchange()
                .expectStatus().isOk();
    }
}
