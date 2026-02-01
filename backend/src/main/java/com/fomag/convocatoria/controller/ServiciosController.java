package com.fomag.convocatoria.controller;

import com.fomag.convocatoria.api.ApiResponse;
import com.fomag.convocatoria.api.dto.DireccionServiciosDto;
import com.fomag.convocatoria.api.dto.RegistroServiciosRequest;
import com.fomag.convocatoria.service.ServiciosService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/servicios")
@Validated
public class ServiciosController {

    private final ServiciosService serviciosService;

    public ServiciosController(ServiciosService serviciosService) {
        this.serviciosService = serviciosService;
    }

    @GetMapping
    public ApiResponse<List<DireccionServiciosDto>> obtenerServicios(@RequestParam("nit") @NotBlank String nit) {
        List<DireccionServiciosDto> data = serviciosService.obtenerServiciosPorNit(nit.trim());
        return ApiResponse.<List<DireccionServiciosDto>>builder().data(data).build();
    }

    @PostMapping("/registro")
    public ResponseEntity<Void> registrarServicios(@Valid @RequestBody RegistroServiciosRequest request) {
        serviciosService.registrarServicios(request);
        return ResponseEntity.ok().build();
    }
}
