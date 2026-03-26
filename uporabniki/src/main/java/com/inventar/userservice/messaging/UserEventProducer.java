package com.inventar.userservice.messaging;

import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Component;

@Component
public class UserEventProducer {

    private final JmsTemplate jmsTemplate;

    public UserEventProducer(JmsTemplate jmsTemplate) {
        this.jmsTemplate = jmsTemplate;
    }

    public void sendUserRegisteredEvent(String username) {
        String message = "USER_REGISTERED:" + username;
        System.out.println("[ActiveMQ] Sending message: " + message);
        jmsTemplate.convertAndSend("user.events", message);
    }

    public void sendUserRoleChangedEvent(String username, String role) {
        String message = "USER_ROLE_CHANGED:" + username + ":" + role;
        System.out.println("[ActiveMQ] Sending message: " + message);
        jmsTemplate.convertAndSend("user.events", message);
    }
}