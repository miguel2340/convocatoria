package com.fomag.convocatoria.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ActualizarSedeSstRequest {
    @NotBlank
    private String nit;
    @NotBlank
    private String direccion; // dirección actual para ubicar registros

    private String departamentoId;
    private String municipioId;
    private String codigoPostal;

    @NotEmpty
    private List<@NotBlank String> servicios;
}
