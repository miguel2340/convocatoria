package com.fomag.convocatoria.service;

import com.fomag.convocatoria.domain.model.Prestador;
import com.fomag.convocatoria.persistence.repository.PrestadorRepository;
import com.fomag.convocatoria.persistence.repository.RegistroPrestadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PrestadorService {

    private final PrestadorRepository prestadorRepository;
    private final RegistroPrestadorRepository registroPrestadorRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public Optional<Prestador> buscarPorNit(String nit) {
        // 1. Si existe en registro_prestadores, devolvemos estado de registro existente
        if (registroPrestadorRepository.existsByNit(nit)) {
            String sql = """
                SELECT TOP 1 nombre_prestador, clase_prestador, telefono_fijo, celular_admin, correo_admin,
                               representante_legal, correo_representante, celular_representante
                FROM dbo.registro_prestadores
                WHERE LTRIM(RTRIM(nit)) = LTRIM(RTRIM(?))
                ORDER BY fecha_registro DESC
                """;
            return jdbcTemplate.query(sql, rs -> {
                if (rs.next()) {
                    return Optional.of(
                            Prestador.builder()
                                    .nit(nit)
                                    .nombre(rs.getString("nombre_prestador"))
                                    .clasePrestador(rs.getString("clase_prestador"))
                                    .telefonoFijo(rs.getString("telefono_fijo"))
                                    .celularAdmin(rs.getString("celular_admin"))
                                    .correoAdmin(rs.getString("correo_admin"))
                                    .representanteLegal(rs.getString("representante_legal"))
                                    .correoRepresentante(rs.getString("correo_representante"))
                                    .celularRepresentante(rs.getString("celular_representante"))
                                    .estado("EXISTE_REGISTRO")
                                    .build()
                    );
                }
                return Optional.empty();
            }, nit);
        }

        // 2. Buscar en prestadores (fuente original)
        return prestadorRepository.findFirstByNit(nit)
                .map(entity -> Prestador.builder()
                        .nit(entity.getNit())
                        .nombre(entity.getNombre())
                        .clasePrestador(null)
                        .telefonoFijo(null)
                        .celularAdmin(null)
                        .correoAdmin(null)
                        .representanteLegal(null)
                        .correoRepresentante(null)
                        .celularRepresentante(null)
                        .estado("ENCONTRADO")
                        .build());
    }

    @Transactional(readOnly = true)
    public boolean existeRegistroSst(String nit) {
        String sql = """
            SELECT COUNT(*) FROM dbo.registro_prestadores
            WHERE LTRIM(RTRIM(nit)) = LTRIM(RTRIM(?))
              AND (
                   UPPER(LTRIM(RTRIM(tipo_registro))) = 'SST'
                OR UPPER(LTRIM(RTRIM(servicio))) = 'SST'
              )
            """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, nit);
        return count != null && count > 0;
    }
}
