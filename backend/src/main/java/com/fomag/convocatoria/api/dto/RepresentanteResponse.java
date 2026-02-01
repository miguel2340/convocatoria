package com.fomag.convocatoria.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepresentanteResponse {
    private String nombrePrestador;
    private String clasePrestador;
    private String telefonoFijo;
    private String celularAdmin;
    private String correoAdmin;
    private String representanteLegal;
    private String correoRepresentante;
    private String celularRepresentante;
}
