package com.fomag.convocatoria.controller;

import com.fomag.convocatoria.api.dto.RegistroSstRequest;
import com.fomag.convocatoria.api.ApiResponse;
import com.fomag.convocatoria.service.RegistroSstService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@RestController
@RequestMapping("/api/registro-sst")
@Validated
public class RegistroSstController {

    private final RegistroSstService registroSstService;

    public RegistroSstController(RegistroSstService registroSstService) {
        this.registroSstService = registroSstService;
    }

    @PostMapping
    public ResponseEntity<Void> registrar(@Valid @RequestBody RegistroSstRequest request) {
        registroSstService.registrarSst(request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/sede")
    public ResponseEntity<Void> actualizarSede(@Valid @RequestBody com.fomag.convocatoria.api.dto.ActualizarSedeSstRequest request) {
        registroSstService.actualizarSede(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/sedes")
    public ApiResponse<List<RegistroSstService.SedeSstDto>> listarSedes(
            @RequestParam("nit") @NotBlank String nit) {
        return ApiResponse.<List<RegistroSstService.SedeSstDto>>builder()
                .data(registroSstService.listarSedes(nit.trim()))
                .build();
    }
}
