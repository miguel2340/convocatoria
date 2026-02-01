package com.fomag.convocatoria.domain.model;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class Prestador {
    String nit;
    String nombre;
    String clasePrestador;
    String estado;
    String telefonoFijo;
    String celularAdmin;
    String correoAdmin;
    String representanteLegal;
    String correoRepresentante;
    String celularRepresentante;
}
