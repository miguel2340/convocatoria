package com.fomag.convocatoria.persistence.repository;

import com.fomag.convocatoria.persistence.entity.PrestadorEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PrestadorRepository extends JpaRepository<PrestadorEntity, String> {
    Optional<PrestadorEntity> findFirstByNit(String nit);
}
