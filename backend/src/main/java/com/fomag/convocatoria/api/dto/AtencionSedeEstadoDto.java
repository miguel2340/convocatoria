package com.fomag.convocatoria.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AtencionSedeEstadoDto {
    private String codHabilitacion;
    private String direccion;
    private String departamento;
    private String municipio;
    private String estado; // SEDE_NUEVA | SIN_DILIGENCIAR | COMPLETA
}
