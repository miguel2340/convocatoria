package com.fomag.convocatoria.persistence.repository;

import com.fomag.convocatoria.persistence.entity.ClaveNitEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaveNitRepository extends JpaRepository<ClaveNitEntity, String> {
}
