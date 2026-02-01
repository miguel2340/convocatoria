package com.fomag.convocatoria.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagoRadicacionPage {
    private String nit;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String prefijo;
    private int page;
    private int size;
    private boolean hasNext;
    private Long totalRows;
    private java.math.BigDecimal totalFacturado;
    private java.math.BigDecimal totalPagado;
    private java.math.BigDecimal totalPendiente;
    private List<PagoRadicacionItem> items;
}
