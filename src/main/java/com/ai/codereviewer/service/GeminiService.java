package com.ai.codereviewer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final WebClient webClient = WebClient.builder().build();
    private final ObjectMapper mapper = new ObjectMapper();

    public Mono<String> reviewCode(String language, String code) {
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of(
                                "text", "Review this " + language + " code and provide detailed suggestions:\n" + code
                        ))
                ))
        );

        return webClient.post()
                .uri(apiUrl)
                .header("Content-Type", "application/json")
                .header("X-goog-api-key", apiKey)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .map(this::extractText)
                .onErrorResume(e -> Mono.just("❌ Error: " + e.getMessage()));
    }

    private String extractText(String jsonResponse) {
        try {
            JsonNode root = mapper.readTree(jsonResponse);
            return root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText("⚠️ No text found.");
        } catch (Exception e) {
            return "❌ Parsing Error: " + e.getMessage();
        }
    }
}
