package com.fomag.convocatoria.controller;

import com.fomag.convocatoria.api.ApiResponse;
import com.fomag.convocatoria.api.dto.ActualizarAtencionRequest;
import com.fomag.convocatoria.api.dto.AtencionSedeDto;
import com.fomag.convocatoria.api.dto.AtencionSedeEstadoDto;
import com.fomag.convocatoria.service.AtencionService;
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

import java.util.List;

@RestController
@RequestMapping("/api/atencion")
@Validated
public class AtencionController {

    private final AtencionService atencionService;

    public AtencionController(AtencionService atencionService) {
        this.atencionService = atencionService;
    }

    @GetMapping("/sedes")
    public ApiResponse<List<AtencionSedeEstadoDto>> sedes(@RequestParam("nit") @NotBlank String nit) {
        return ApiResponse.<List<AtencionSedeEstadoDto>>builder()
                .data(atencionService.listarSedes(nit.trim()))
                .build();
    }

    @GetMapping("/sede")
    public ApiResponse<AtencionSedeDto> sede(
            @RequestParam("nit") @NotBlank String nit,
            @RequestParam("cod") @NotBlank String cod) {
        return ApiResponse.<AtencionSedeDto>builder()
                .data(atencionService.obtenerSede(nit.trim(), cod.trim()))
                .build();
    }

    @PutMapping("/sede")
    public ResponseEntity<Void> guardar(@Valid @RequestBody ActualizarAtencionRequest request) {
        atencionService.guardar(request);
        return ResponseEntity.ok().build();
    }
}
