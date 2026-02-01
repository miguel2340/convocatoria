package com.fomag.convocatoria.controller;

import com.fomag.convocatoria.api.ApiResponse;
import com.fomag.convocatoria.api.dto.DepartamentoDto;
import com.fomag.convocatoria.api.dto.MunicipioDto;
import com.fomag.convocatoria.service.CatalogosService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos")
@Validated
public class CatalogosController {

    private final CatalogosService catalogosService;

    public CatalogosController(CatalogosService catalogosService) {
        this.catalogosService = catalogosService;
    }

    @GetMapping("/departamentos")
    public ApiResponse<List<DepartamentoDto>> departamentos() {
        return ApiResponse.<List<DepartamentoDto>>builder()
                .data(catalogosService.obtenerDepartamentos())
                .build();
    }

    @GetMapping("/municipios")
    public ApiResponse<List<MunicipioDto>> municipios(@RequestParam("departamentoId") @NotBlank String departamentoId) {
        return ApiResponse.<List<MunicipioDto>>builder()
                .data(catalogosService.obtenerMunicipiosPorDepartamento(departamentoId))
                .build();
    }
}
