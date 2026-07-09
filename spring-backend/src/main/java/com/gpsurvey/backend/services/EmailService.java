package com.gpsurvey.backend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendRegistrationEmail(String toEmail, String username, String password) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Welcome to GP Survey - Account Created");
        
        String body = "Hello,\n\n" +
                "Your company account has been successfully created.\n\n" +
                "Here are your login credentials:\n" +
                "Username: " + username + "\n" +
                "Password: " + password + "\n\n" +
                "Currently, your account does not have an active subscription, so you will not be able to log in to the server yet.\n\n" +
                "Please contact our marketing team at marketing@gpsurvey.com or reply to this email, and we will activate your subscription so you can get started.\n\n" +
                "Thank you,\nGP Survey Team";
                
        message.setText(body);
        
        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }
}
