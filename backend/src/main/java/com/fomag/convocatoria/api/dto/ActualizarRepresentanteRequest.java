package com.fomag.convocatoria.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ActualizarRepresentanteRequest {
    @NotBlank
    private String nit;
    @NotBlank
    private String nombrePrestador;
    @NotBlank
    private String clasePrestador;
    private String telefonoFijo;
    private String celularAdmin;
    private String correoAdmin;
    @NotBlank
    private String representanteLegal;
    private String correoRepresentante;
    private String celularRepresentante;
}
