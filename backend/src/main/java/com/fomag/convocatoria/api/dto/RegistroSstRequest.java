package com.fomag.convocatoria.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class RegistroSstRequest {
    @NotBlank
    private String nit;
    @NotBlank
    private String nombrePrestador;
    @NotBlank
    private String clasePrestador;
    @NotBlank
    private String telefonoFijo;
    @NotBlank
    private String celularAdmin;
    @NotBlank
    private String correoAdmin;
    @NotBlank
    private String representanteLegal;
    @NotBlank
    private String correoRepresentante;
    @NotBlank
    private String celularRepresentante;

    @NotEmpty
    @Valid
    private List<SedeSst> sedes;

    @Data
    public static class SedeSst {
        @NotBlank private String tipoVia;
        @NotBlank private String numeroVia;
        private String letraVia;
        @NotBlank private String numeroPlaca;
        @NotBlank private String departamentoId;
        @NotBlank private String municipioId;
        private String codigoPostal;
        @NotEmpty private List<String> servicios; // Selecciones SST
    }
}
