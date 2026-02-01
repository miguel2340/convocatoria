package com.fomag.convocatoria.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ArchivoDto {
    String nombre;
    long tamano;
    String modificado;
}

