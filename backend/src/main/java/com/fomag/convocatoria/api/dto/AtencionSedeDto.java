package com.fomag.convocatoria.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AtencionSedeDto {
    private String codHabilitacion;
    private String direccion;
    private String departamento;
    private String municipio;
    private String mecanismoCitas;
    private String correoAutorizado;
    private String telefonoFijo;
    private String celular;
    private String horarioDesde;
    private String horarioHasta;
    private String whatsapp;
    private String horarioWhatsappDesde;
    private String horarioWhatsappHasta;
    private String lineaTelefonica;
    private String horarioTelefonoDesde;
    private String horarioTelefonoHasta;
    private String paginaWeb;
    private String correoNoPresencial;
    private String nombreCoordinador;
    private String telefonoCoordinador;
    private String correoCoordinador;
    private String nombreGerente;
    private String correoGerente;
    private String celularGerente;
    private String correoAdministrativo;
    private String telefonoAdministrativo;
    private String celularAdministrativo;
    private boolean ambulatorio;
    private boolean hospitalario;
    private boolean domiciliario;
    private boolean transporte;
    private boolean insumos;
    private boolean servicioExclusivo;
    private boolean servicioAgenda;
    private boolean servicioFranjas;
}
