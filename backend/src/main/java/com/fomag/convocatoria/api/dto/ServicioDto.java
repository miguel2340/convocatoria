package com.fomag.convocatoria.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder(toBuilder = true)
public class ServicioDto {
    String codigo;
    String nombre;
    String grupo;
    String codHabilitacion;
    String direccion;
    String departamento;
    String municipio;
    boolean yaRegistrado;
}
