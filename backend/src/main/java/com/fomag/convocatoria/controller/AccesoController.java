package com.fomag.convocatoria.controller;

import com.fomag.convocatoria.api.ApiResponse;
import com.fomag.convocatoria.security.JwtService;
import com.fomag.convocatoria.service.AccesoService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/acceso")
@Validated
public class AccesoController {

    private final AccesoService accesoService;
    private final JwtService jwtService;

    public AccesoController(AccesoService accesoService, JwtService jwtService) {
        this.accesoService = accesoService;
        this.jwtService = jwtService;
    }

    @GetMapping("/estado")
    public ApiResponse<AccesoService.EstadoAcceso> estado(@RequestParam("nit") @NotBlank String nit) {
        return ApiResponse.<AccesoService.EstadoAcceso>builder()
                .data(accesoService.estado(nit.trim()))
                .build();
    }

    public record ClavePayload(@NotBlank String nit, @NotBlank @Size(min = 6, max = 64) String clave) {}

    @PostMapping("/crear")
    public ResponseEntity<Void> crear(@RequestBody ClavePayload payload) {
        accesoService.crearClave(payload.nit().trim(), payload.clave().trim());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody ClavePayload payload) {
        String nit = payload.nit().trim();
        accesoService.validarIngreso(nit, payload.clave().trim());
        String token = jwtService.generateToken(nit);
        return ResponseEntity.ok(new LoginResponse(nit, token));
    }

    public record LoginResponse(String nit, String token) {}

    @GetMapping("/recuperacion/preguntas")
    public AccesoService.RecuperacionPreguntas preguntas(@RequestParam("nit") @NotBlank String nit) {
        return accesoService.obtenerPreguntas(nit.trim());
    }

    public record ValidarRequest(
            @NotBlank String nit,
            @NotBlank String desafioId,
            Map<String, String> respuestas) {}

    @PostMapping("/recuperacion/validar")
    public AccesoService.RecuperacionValidacion validar(@RequestBody ValidarRequest request) {
        return accesoService.validarPreguntas(request.nit().trim(), request.desafioId().trim(), request.respuestas());
    }

    public record RestablecerRequest(@NotBlank String tokenRecuperacion,
                                     @NotBlank @Size(min = 6, max = 64) String clave) {}

    @PostMapping("/recuperacion/restablecer")
    public ResponseEntity<Void> restablecer(@RequestBody RestablecerRequest request) {
        accesoService.restablecerClave(request.tokenRecuperacion().trim(), request.clave().trim());
        return ResponseEntity.ok().build();
    }
}
