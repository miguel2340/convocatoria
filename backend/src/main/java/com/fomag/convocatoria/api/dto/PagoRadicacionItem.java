package com.fomag.convocatoria.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagoRadicacionItem {
    private String nit;
    private String prefijoFactura;
    private LocalDate fechaRadicacion;
    private BigDecimal valorFacturado;
    private BigDecimal valorPagado;
    private LocalDate fechaPago;
}
