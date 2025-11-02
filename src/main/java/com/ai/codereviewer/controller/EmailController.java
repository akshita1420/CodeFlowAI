package com.ai.codereviewer.controller;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    private final JavaMailSender sender;

    public EmailController(JavaMailSender sender) {
        this.sender = sender;
    }

    @PostMapping("/send")
    public String send(@RequestParam String to,
                       @RequestParam String subject,
                       @RequestParam String body) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);
        sender.send(msg);
        return "✅ Email sent to " + to;
    }
}
