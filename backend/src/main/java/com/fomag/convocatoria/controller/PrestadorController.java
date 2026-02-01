package com.fomag.convocatoria.controller;

import com.fomag.convocatoria.api.ApiResponse;
import com.fomag.convocatoria.domain.model.Prestador;
import com.fomag.convocatoria.service.PrestadorService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/prestadores")
@Validated
public class PrestadorController {

    private final PrestadorService prestadorService;

    public PrestadorController(PrestadorService prestadorService) {
        this.prestadorService = prestadorService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Prestador>> buscarPorNit(@RequestParam("nit") @NotBlank String nit) {
        Optional<Prestador> prestador = prestadorService.buscarPorNit(nit.trim());

        if (prestador.isEmpty()) {
            ApiResponse<Prestador> error = ApiResponse.<Prestador>builder()
                    .error(ApiResponse.ErrorData.builder()
                            .code("PRESTADOR_NO_ENCONTRADO")
                            .message("No se encontró el prestador para el NIT indicado.")
                            .build())
                    .build();
            return ResponseEntity.status(404).body(error);
        }

        return ResponseEntity.ok(ApiResponse.<Prestador>builder()
                .data(prestador.get())
                .build());
    }

    @GetMapping("/sst/existe")
    public ApiResponse<Boolean> existeSst(@RequestParam("nit") @NotBlank String nit) {
        boolean existe = prestadorService.existeRegistroSst(nit.trim());
        return ApiResponse.<Boolean>builder().data(existe).build();
    }
}
