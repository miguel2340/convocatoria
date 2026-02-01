package com.fomag.convocatoria.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagoResumenResponse {
    private String nit;
    private String nomPrestador;
    private Integer anio;
    private Integer mes;
    private BigDecimal totalValorPagado;
}
