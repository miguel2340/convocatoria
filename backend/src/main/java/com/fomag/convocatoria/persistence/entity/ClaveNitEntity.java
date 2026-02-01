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
@Table(name = "clave_nit", schema = "dbo")
public class ClaveNitEntity {

    @Id
    @Column(name = "nit", nullable = false, length = 20)
    private String nit;

    @Column(name = "clave", nullable = false)
    private String clave;
}
