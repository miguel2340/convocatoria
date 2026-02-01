package com.fomag.convocatoria.controller;

import com.fomag.convocatoria.api.dto.RegistroNuevoRequest;
import com.fomag.convocatoria.service.RegistroNuevoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/registro-nuevo")
public class RegistroNuevoController {

    private final RegistroNuevoService registroNuevoService;

    public RegistroNuevoController(RegistroNuevoService registroNuevoService) {
        this.registroNuevoService = registroNuevoService;
    }

    @PostMapping
    public ResponseEntity<Void> registrar(@Valid @RequestBody RegistroNuevoRequest request) {
        registroNuevoService.registrarNuevo(request);
        return ResponseEntity.ok().build();
    }
}
