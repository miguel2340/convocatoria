package com.fomag.convocatoria.api.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class SubsanacionEvaluacionResponse {
    String etapa; // PRIMERA o SEGUNDA
    List<SubsanacionEvaluacionItem> items;
}

