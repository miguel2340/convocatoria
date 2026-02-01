package com.fomag.convocatoria.controller;

import com.fomag.convocatoria.api.ApiResponse;
import com.fomag.convocatoria.api.dto.ActualizarRepresentanteRequest;
import com.fomag.convocatoria.api.dto.RepresentanteResponse;
import com.fomag.convocatoria.service.AccesoService;
import com.fomag.convocatoria.service.RepresentanteService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/representante")
@Validated
public class RepresentanteController {

    private final RepresentanteService representanteService;
    private final AccesoService accesoService;

    public RepresentanteController(RepresentanteService representanteService, AccesoService accesoService) {
        this.representanteService = representanteService;
        this.accesoService = accesoService;
    }

    @GetMapping
    public ApiResponse<RepresentanteResponse> obtener(@RequestParam("nit") @NotBlank String nit) {
        Optional<RepresentanteResponse> data = representanteService.obtenerPorNit(nit.trim());
        return ApiResponse.<RepresentanteResponse>builder()
                .data(data.orElse(null))
                .build();
    }

    @PutMapping
    public ResponseEntity<Void> actualizar(@Valid @RequestBody ActualizarRepresentanteRequest request) {
        representanteService.actualizar(request);
        return ResponseEntity.ok().build();
    }

    public record ActualizarBasicoRequest(
            @NotBlank String tokenRecuperacion,
            String representanteLegal,
            String correoRepresentante,
            String celularRepresentante,
            String correoAdmin) {}

    @PutMapping("/recuperacion")
    public ResponseEntity<Void> actualizarDesdeRecuperacion(@Valid @RequestBody ActualizarBasicoRequest request) {
        String nit = accesoService.validarTokenRecuperacion(request.tokenRecuperacion().trim());
        representanteService.actualizarBasico(nit,
                request.representanteLegal(),
                request.correoRepresentante(),
                request.celularRepresentante(),
                request.correoAdmin());
        return ResponseEntity.ok().build();
    }
}
