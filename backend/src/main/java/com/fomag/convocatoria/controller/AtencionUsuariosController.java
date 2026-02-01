package com.fomag.convocatoria.controller;

import com.fomag.convocatoria.api.dto.AtencionUsuariosRequest;
import com.fomag.convocatoria.service.AtencionUsuariosService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/atencion-usuarios")
public class AtencionUsuariosController {

    private final AtencionUsuariosService atencionUsuariosService;

    public AtencionUsuariosController(AtencionUsuariosService atencionUsuariosService) {
        this.atencionUsuariosService = atencionUsuariosService;
    }

    @PostMapping
    public ResponseEntity<Void> registrar(@Valid @RequestBody AtencionUsuariosRequest request) {
        atencionUsuariosService.registrar(request);
        return ResponseEntity.ok().build();
    }
}
