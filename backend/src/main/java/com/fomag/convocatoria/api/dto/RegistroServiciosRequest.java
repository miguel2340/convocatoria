package com.fomag.convocatoria.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Value;

import java.util.List;

@Value
public class RegistroServiciosRequest {
    @NotBlank String nit;
    String nombre;
    @NotBlank String clasePrestador;

    @NotBlank
    @Pattern(regexp = "^[0-9]{7,10}$")
    String telefonoFijo;

    @NotBlank
    @Pattern(regexp = "^[0-9]{7,10}$")
    String celularAdmin;

    @NotBlank
    @Email
    String correoAdmin;

    @NotBlank String representanteLegal;

    @NotBlank
    @Email
    String correoRepresentante;

    @NotBlank
    @Pattern(regexp = "^[0-9]{7,10}$")
    String celularRepresentante;

    @Valid
    @NotEmpty
    List<ServicioPayload> servicios;

    @Value
    public static class ServicioPayload {
        @NotBlank String codigo;
        @NotBlank String nombre;
        String grupo;
        @NotBlank String codHabilitacion;
        @NotBlank String direccion;
        @NotBlank String departamento;
        @NotBlank String municipio;
    }
}
