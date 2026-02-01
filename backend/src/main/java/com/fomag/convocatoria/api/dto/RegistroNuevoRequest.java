package com.fomag.convocatoria.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class RegistroNuevoRequest {
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

    private boolean transporte;
    private boolean insumosMedicos;
    private boolean medicamentos;

    @NotEmpty
    @Valid
    private List<SedeNueva> sedes;

    @Data
    public static class SedeNueva {
        @NotBlank private String tipoVia;
        @NotBlank private String numeroVia;
        private String letraVia;
        @NotBlank private String numeroPlaca;
        @NotBlank private String departamentoId;
        @NotBlank private String municipioId;
        private String serviciosNoReps;
        private String codigoPostal;
    }
}
