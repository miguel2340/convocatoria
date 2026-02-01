package com.fomag.convocatoria.controller;

import com.fomag.convocatoria.api.ApiResponse;
import com.fomag.convocatoria.api.dto.ArchivoDto;
import com.fomag.convocatoria.api.dto.SubsanacionEvaluacionResponse;
import com.fomag.convocatoria.service.SubsanacionService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/subsanacion")
@Validated
public class SubsanacionController {

    private final SubsanacionService subsanacionService;

    public SubsanacionController(SubsanacionService subsanacionService) {
        this.subsanacionService = subsanacionService;
    }

    @GetMapping("/evaluacion")
    public ApiResponse<SubsanacionEvaluacionResponse> evaluacion(@RequestParam("nit") @NotBlank String nit) {
        SubsanacionEvaluacionResponse data = subsanacionService.obtenerEvaluacion(nit.trim());
        return ApiResponse.<SubsanacionEvaluacionResponse>builder().data(data).build();
    }

    @GetMapping("/soportes")
    public ApiResponse<List<ArchivoDto>> listar(@RequestParam("nit") @NotBlank String nit) {
        List<ArchivoDto> data = subsanacionService.listarSoportes(nit.trim());
        return ApiResponse.<List<ArchivoDto>>builder().data(data).build();
    }

    @PostMapping("/soportes")
    public ResponseEntity<Void> subir(@RequestParam("nit") @NotBlank String nit,
                                      @RequestParam("files") MultipartFile[] files) {
        subsanacionService.subirSoportes(nit.trim(), files);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/soportes")
    public ResponseEntity<Void> eliminar(@RequestParam("nit") @NotBlank String nit,
                                         @RequestParam("archivo") @NotBlank String archivo) {
        subsanacionService.eliminarSoporte(nit.trim(), archivo.trim());
        return ResponseEntity.ok().build();
    }
}

