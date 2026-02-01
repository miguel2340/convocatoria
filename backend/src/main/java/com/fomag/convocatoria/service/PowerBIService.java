package com.fomag.convocatoria.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PowerBIService {

    private final WebClient.Builder webClientBuilder;

    @Value("${pbi.tenant-id}")
    private String tenantId;

    @Value("${pbi.client-id}")
    private String clientId;

    @Value("${pbi.client-secret}")
    private String clientSecret;

    @Value("${pbi.group-id}")
    private String groupId;

    @Value("${pbi.report-id}")
    private String reportId;

    @Value("${pbi.dataset-id}")
    private String datasetId;

    @Value("${pbi.rls-role:PrestadorRLS}")
    private String rlsRole;

    public EmbedConfig getEmbedConfig(String nit) {
        ensureConfigured();
        String accessToken = acquireAccessToken();
        EmbedTokenResponse embedToken = generateEmbedToken(accessToken, nit.trim());
        String embedUrl = String.format("https://app.powerbi.com/reportEmbed?reportId=%s&groupId=%s", reportId, groupId);
        return new EmbedConfig(reportId, embedUrl, embedToken.token(), embedToken.expiration());
    }

    private void ensureConfigured() {
        if (!StringUtils.hasText(tenantId) || !StringUtils.hasText(clientId) || !StringUtils.hasText(clientSecret)
                || !StringUtils.hasText(groupId) || !StringUtils.hasText(reportId) || !StringUtils.hasText(datasetId)) {
            log.error("Power BI configuration is missing required values (tenant, client, group, report or dataset)");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Power BI auth/config error");
        }
    }

    private String acquireAccessToken() {
        WebClient client = webClientBuilder.build();
        TokenResponse tokenResponse = client.post()
                .uri("https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token", tenantId)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("client_id", clientId)
                        .with("client_secret", clientSecret)
                        .with("grant_type", "client_credentials")
                        .with("scope", "https://analysis.windows.net/powerbi/api/.default"))
                .retrieve()
                .onStatus(HttpStatusCode::isError,
                        response -> logAndMapPowerBIError("Entra ID token request", response, true))
                .bodyToMono(TokenResponse.class)
                .block();

        if (tokenResponse == null || tokenResponse.accessToken() == null || tokenResponse.accessToken().isBlank()) {
            log.error("Entra ID token request returned empty token");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Power BI auth/config error");
        }

        return tokenResponse.accessToken();
    }

    private EmbedTokenResponse generateEmbedToken(String accessToken, String nit) {
        WebClient client = webClientBuilder.build();
        Map<String, Object> payload = Map.of("accessLevel", "View");

        // Solo enviamos identities cuando hay rol RLS configurado.
        if (StringUtils.hasText(rlsRole) && !"none".equalsIgnoreCase(rlsRole)) {
            payload = Map.of(
                    "accessLevel", "View",
                    "identities", List.of(Map.of(
                            "username", nit,
                            "roles", List.of(rlsRole),
                            "datasets", List.of(datasetId)
                    ))
            );
        }

        EmbedTokenResponse response = client.post()
                .uri("https://api.powerbi.com/v1.0/myorg/groups/{groupId}/reports/{reportId}/GenerateToken", groupId, reportId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .onStatus(HttpStatusCode::isError,
                        clientResponse -> logAndMapPowerBIError("Power BI embed token request", clientResponse, false))
                .bodyToMono(EmbedTokenResponse.class)
                .block();

        if (response == null || response.token() == null || response.token().isBlank()) {
            log.error("Power BI embed token request returned empty token");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Power BI auth/config error");
        }
        return response;
    }

    private Mono<ResponseStatusException> logAndMapPowerBIError(String stage, ClientResponse response, boolean redactBody) {
        return response.bodyToMono(String.class)
                .defaultIfEmpty("")
                .flatMap(body -> {
                    if (redactBody) {
                        log.error("{} failed with status {}", stage, response.statusCode().value());
                    } else {
                        log.error("{} failed with status {} body={}", stage, response.statusCode().value(), body);
                    }
                    return Mono.error(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Power BI auth/config error"));
                });
    }

    public record EmbedConfig(String reportId, String embedUrl, String embedToken, String expiration) {}

    private record TokenResponse(@JsonProperty("access_token") String accessToken) {}

    private record EmbedTokenResponse(String token, String expiration) {}
}
