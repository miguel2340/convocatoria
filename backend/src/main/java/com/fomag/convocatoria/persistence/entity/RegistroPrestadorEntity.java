package com.fomag.convocatoria.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "registro_prestadores", schema = "dbo")
public class RegistroPrestadorEntity {

    @Id
    @Column(name = "nit", nullable = false, length = 20)
    private String nit;

    @Column(name = "nombre_prestador")
    private String nombre;
}
