package com.fomag.convocatoria.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SubsanacionEvaluacionItem {
    String tipoCalificacion;
    String numero;
    String documentoRevisar;
    String descripcion;
    String resultado;
    String fechaEvaluacion;
    String observacion;
}

