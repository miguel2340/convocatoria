package com.fomag.convocatoria.api.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class DireccionServiciosDto {
    String codHabilitacion;
    String direccion;
    String departamento;
    String municipio;
    List<ServicioDto> servicios;
}
