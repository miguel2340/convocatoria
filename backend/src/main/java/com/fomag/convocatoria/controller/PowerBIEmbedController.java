package com.fomag.convocatoria.controller;

import com.fomag.convocatoria.service.PowerBIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/pbi")
@RequiredArgsConstructor
public class PowerBIEmbedController {

    private final PowerBIService powerBIService;

    @GetMapping("/embed-config")
    public PowerBIService.EmbedConfig embedConfig(@AuthenticationPrincipal String nit) {
        if (nit == null || nit.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalido");
        }
        return powerBIService.getEmbedConfig(nit);
    }
}
