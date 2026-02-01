package com.fomag.convocatoria.persistence.repository;

import com.fomag.convocatoria.persistence.entity.RegistroPrestadorEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistroPrestadorRepository extends JpaRepository<RegistroPrestadorEntity, String> {
    boolean existsByNit(String nit);
}
