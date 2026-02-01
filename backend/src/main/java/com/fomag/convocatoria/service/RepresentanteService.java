package com.fomag.convocatoria.service;

import com.fomag.convocatoria.api.dto.ActualizarRepresentanteRequest;
import com.fomag.convocatoria.api.dto.RepresentanteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RepresentanteService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public Optional<RepresentanteResponse> obtenerPorNit(String nit) {
        String sql = """
            SELECT TOP 1
                nombre_prestador,
                clase_prestador,
                telefono_fijo,
                celular_admin,
                correo_admin,
                representante_legal,
                correo_representante,
                celular_representante
            FROM dbo.registro_prestadores
            WHERE LTRIM(RTRIM(nit)) = LTRIM(RTRIM(?))
            ORDER BY fecha_registro DESC
            """;
        return jdbcTemplate.query(sql, rs -> {
            if (rs.next()) {
                return Optional.of(RepresentanteResponse.builder()
                        .nombrePrestador(rs.getString("nombre_prestador"))
                        .clasePrestador(rs.getString("clase_prestador"))
                        .telefonoFijo(rs.getString("telefono_fijo"))
                        .celularAdmin(rs.getString("celular_admin"))
                        .correoAdmin(rs.getString("correo_admin"))
                        .representanteLegal(rs.getString("representante_legal"))
                        .correoRepresentante(rs.getString("correo_representante"))
                        .celularRepresentante(rs.getString("celular_representante"))
                        .build());
            }
            return Optional.empty();
        }, nit);
    }

    @Transactional
    public void actualizar(ActualizarRepresentanteRequest request) {
        String sql = """
            UPDATE dbo.registro_prestadores SET
                nombre_prestador = ?,
                clase_prestador = ?,
                telefono_fijo = ?,
                celular_admin = ?,
                correo_admin = ?,
                representante_legal = ?,
                correo_representante = ?,
                celular_representante = ?
            WHERE LTRIM(RTRIM(nit)) = LTRIM(RTRIM(?))
            """;
        try {
            jdbcTemplate.update(sql,
                    request.getNombrePrestador(),
                    request.getClasePrestador(),
                    request.getTelefonoFijo(),
                    request.getCelularAdmin(),
                    request.getCorreoAdmin(),
                    request.getRepresentanteLegal(),
                    request.getCorreoRepresentante(),
                    request.getCelularRepresentante(),
                    request.getNit());
        } catch (DataAccessException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al actualizar datos del representante legal", e);
        }
    }

    @Transactional
    public void actualizarBasico(String nit, String representanteLegal, String correoRepresentante, String celularRepresentante, String correoAdmin) {
        String sql = """
            UPDATE dbo.registro_prestadores SET
                representante_legal = ?,
                correo_representante = ?,
                celular_representante = ?,
                correo_admin = ?
            WHERE LTRIM(RTRIM(nit)) = LTRIM(RTRIM(?))
            """;
        try {
            jdbcTemplate.update(sql,
                    representanteLegal,
                    correoRepresentante,
                    celularRepresentante,
                    correoAdmin,
                    nit);
        } catch (DataAccessException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al actualizar datos del representante legal", e);
        }
    }
}
