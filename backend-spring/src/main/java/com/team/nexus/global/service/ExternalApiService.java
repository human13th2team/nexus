package com.team.nexus.global.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@Slf4j
public class ExternalApiService {

    private final RestTemplate restTemplate = new RestTemplate();

    public <T> T post(String url, Object body, Map<String, String> headers, Class<T> responseType) {
        HttpHeaders httpHeaders = new HttpHeaders();
        if (headers != null) {
            headers.forEach(httpHeaders::add);
        }
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Object> requestEntity = new HttpEntity<>(body, httpHeaders);

        try {
            ResponseEntity<T> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, responseType);
            return response.getBody();
        } catch (Exception e) {
            log.error("External API POST request failed. URL: {}, Error: {}", url, e.getMessage());
            throw new RuntimeException("External API call failed: " + e.getMessage());
        }
    }

    public <T> T get(String url, Map<String, String> headers, Class<T> responseType) {
        HttpHeaders httpHeaders = new HttpHeaders();
        if (headers != null) {
            headers.forEach(httpHeaders::add);
        }

        HttpEntity<Void> requestEntity = new HttpEntity<>(httpHeaders);

        try {
            ResponseEntity<T> response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, responseType);
            return response.getBody();
        } catch (Exception e) {
            log.error("External API GET request failed. URL: {}, Error: {}", url, e.getMessage());
            throw new RuntimeException("External API call failed: " + e.getMessage());
        }
    }
}
