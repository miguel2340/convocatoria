package com.fomag.convocatoria.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AtencionUsuariosRequest {

    @NotBlank
    private String nit;

    @NotEmpty
    @Valid
    private List<SedeRequest> sedes;

    @Data
    public static class SedeRequest {
        @NotBlank private String codHabilitacion;
        @NotBlank private String direccion;
        @NotBlank private String departamento;
        @NotBlank private String municipio;
        @NotBlank private String mecanismoCitas;

        private List<String> tipoServicio;
        private boolean servicioExclusivo;
        private boolean servicioAgenda;
        private boolean servicioFranjas;

        @Valid private HorarioRequest horarioPresencial;
        @Valid private HorarioRequest horarioWhatsapp;
        @Valid private HorarioRequest horarioTelefono;
        private String whatsapp;
        private String lineaTelefonica;
        private String paginaWeb;
        private String correoNoPresencial;
        @Valid private GerenteRequest gerente;
        @Valid private CoordinadorRequest coordinador;
    }

    @Data
    public static class HorarioRequest {
        private String desde;
        private String hasta;
    }

    @Data
    public static class GerenteRequest {
        private String nombre;
        private String correoAutorizado;
        private String telefonoFijo;
        private String celular;
        private String correoGerente;
        private String celularGerente;
        private String correoAdministrativo;
        private String telefonoAdministrativo;
        private String celularAdministrativo;
    }

    @Data
    public static class CoordinadorRequest {
        private String nombre;
        private String telefono;
        private String correo;
    }
}
