package com.ai.codereviewer.controller;

import com.ai.codereviewer.model.CodeReviewRequest;
import com.ai.codereviewer.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/review")
public class CodeReviewController {

    private final GeminiService geminiService;

    public CodeReviewController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping
    public Mono<ResponseEntity<String>> reviewCode(@RequestBody CodeReviewRequest request) {
        return geminiService.reviewCode(request.getLanguage(), request.getCode())
                .map(response -> ResponseEntity.ok("🧠 Gemini Review:\n\n" + response));
    }
}
