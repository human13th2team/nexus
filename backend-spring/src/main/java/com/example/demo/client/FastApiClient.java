package com.example.demo.client;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class FastApiClient {

    private final WebClient webClient;

    public FastApiClient(WebClient.Builder webClientBuilder) {
        // FastAPI 서버 주소 (8000)
        this.webClient = webClientBuilder.baseUrl("http://localhost:8000").build();
    }

    /**
     * FastAPI 서버의 헬스체크 API를 호출
     */
    public Mono<Map> getFastApiHealth() {
        return this.webClient.get()
                .uri("/health")
                .retrieve()
                .bodyToMono(Map.class);
    }

    /**
     * FastAPI 서버로 메시지를 전송
     */
    public Mono<Map> sendToFastApi(String message) {
        return this.webClient.post()
                .uri("/receive-from-spring")
                .bodyValue(Map.of(
                    "message", message,
                    "sender", "Spring Boot"
                ))
                .retrieve()
                .bodyToMono(Map.class);
    }
}
