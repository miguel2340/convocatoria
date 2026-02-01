package com.fomag.convocatoria.service;

import com.fomag.convocatoria.api.dto.RegistroSstRequest;
import com.fomag.convocatoria.api.dto.ActualizarSedeSstRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RegistroSstService {

    private final JdbcTemplate jdbcTemplate;

    private static final String INSERT_SQL = """
        INSERT INTO dbo.registro_prestadores
        (nit, nombre_prestador, clase_prestador, telefono_fijo, celular_admin, correo_admin,
         representante_legal, correo_representante, celular_representante,
         direccion, departamento, municipio, servicio, servicio_no_reps, codigo_postal,
         transporte, insumos_medicos, medicamentos, tipo_registro, fecha_registro)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
        """;

    @Transactional
    public void registrarSst(RegistroSstRequest request) {
        String nombrePrestador = normalizarNombre(request.getNombrePrestador(), request.getNit());
        for (RegistroSstRequest.SedeSst sede : request.getSedes()) {
            String direccion = construirDireccion(sede);
            log.info("Registrando SST - nit={}, direccion={}, depto={}, muni={}, servicios={}",
                    request.getNit(), direccion, sede.getDepartamentoId(), sede.getMunicipioId(), sede.getServicios());
            for (String servicio : sede.getServicios()) {
                Object[] params = new Object[]{
                        request.getNit(),
                        nombrePrestador,
                        request.getClasePrestador(),
                        request.getTelefonoFijo(),
                        request.getCelularAdmin(),
                        request.getCorreoAdmin(),
                        request.getRepresentanteLegal(),
                        request.getCorreoRepresentante(),
                        request.getCelularRepresentante(),
                        direccion,
                        sede.getDepartamentoId(),
                        sede.getMunicipioId(),
                        "SST",
                        servicio, // guardamos el nombre del servicio SST en servicio_no_reps
                        sede.getCodigoPostal(),
                        0,
                        0,
                        0,
                        "SST"
                };
                try {
                    jdbcTemplate.update(INSERT_SQL, params);
                } catch (DataAccessException e) {
                    log.error("Error al registrar SST para nit={}, servicio={}, direccion={}", request.getNit(), servicio, direccion, e);
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al registrar servicio SST " + servicio + " para la sede " + direccion + ": " + e.getMessage(), e);
                }
            }
        }
    }

    @Transactional
    public void actualizarSede(ActualizarSedeSstRequest request) {
        // Tomar muestra de la sede actual
        String selectSql = """
            SELECT TOP 1 *
            FROM dbo.registro_prestadores
            WHERE LTRIM(RTRIM(nit)) = LTRIM(RTRIM(?))
              AND LTRIM(RTRIM(direccion)) = LTRIM(RTRIM(?))
              AND (UPPER(LTRIM(RTRIM(tipo_registro))) = 'SST' OR UPPER(LTRIM(RTRIM(servicio))) = 'SST')
            """;
        var base = jdbcTemplate.queryForMap(selectSql, request.getNit(), request.getDireccion());
        if (base == null || base.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró la sede SST indicada.");
        }

        // Borrar filas actuales de la sede
        String deleteSql = """
            DELETE FROM dbo.registro_prestadores
            WHERE LTRIM(RTRIM(nit)) = LTRIM(RTRIM(?))
              AND LTRIM(RTRIM(direccion)) = LTRIM(RTRIM(?))
              AND (UPPER(LTRIM(RTRIM(tipo_registro))) = 'SST' OR UPPER(LTRIM(RTRIM(servicio))) = 'SST')
            """;
        jdbcTemplate.update(deleteSql, request.getNit(), request.getDireccion());

        // Preparar valores base conservados
        Object clasePrestador = base.getOrDefault("clase_prestador", "");
        Object telefonoFijo = base.getOrDefault("telefono_fijo", "");
        Object celularAdmin = base.getOrDefault("celular_admin", "");
        Object correoAdmin = base.getOrDefault("correo_admin", "");
        Object representanteLegal = base.getOrDefault("representante_legal", "");
        Object correoRepresentante = base.getOrDefault("correo_representante", "");
        Object celularRepresentante = base.getOrDefault("celular_representante", "");

        String direccionFinal = (String) base.get("direccion"); // no cambiamos dirección en esta versión
        String departamentoFinal = request.getDepartamentoId() != null ? request.getDepartamentoId() : (String) base.get("departamento");
        String municipioFinal = request.getMunicipioId() != null ? request.getMunicipioId() : (String) base.get("municipio");
        String codigoPostalFinal = request.getCodigoPostal() != null ? request.getCodigoPostal() : (String) base.get("codigo_postal");

        String nombrePrestador = base.get("nombre_prestador") != null
                ? base.get("nombre_prestador").toString()
                : "";

        for (String servicio : request.getServicios()) {
            Object[] params = new Object[]{
                    request.getNit(),
                    nombrePrestador,
                    clasePrestador,
                    telefonoFijo,
                    celularAdmin,
                    correoAdmin,
                    representanteLegal,
                    correoRepresentante,
                    celularRepresentante,
                    direccionFinal,
                    departamentoFinal,
                    municipioFinal,
                    "SST",
                    servicio,
                    codigoPostalFinal,
                    0,
                    0,
                    0,
                    "SST"
            };
            jdbcTemplate.update(INSERT_SQL, params);
        }
    }

    private String normalizarNombre(String nombreEnviado, String nit) {
        String candidato = nombreEnviado != null ? nombreEnviado.trim() : "";
        if (!candidato.isBlank() && !candidato.equalsIgnoreCase(nit)) {
            return candidato;
        }
        try {
            String sql = """
                SELECT TOP 1 nombre_prestador
                FROM dbo.registro_prestadores
                WHERE LTRIM(RTRIM(nit)) = LTRIM(RTRIM(?))
                  AND nombre_prestador IS NOT NULL
                  AND LTRIM(RTRIM(nombre_prestador)) <> ''
                ORDER BY fecha_registro DESC
                """;
            String existente = jdbcTemplate.queryForObject(sql, String.class, nit);
            if (existente != null && !existente.trim().isBlank()) {
                return existente.trim();
            }
        } catch (Exception ignored) {
        }
        return candidato.isBlank() ? nit : candidato;
    }

    @Transactional(readOnly = true)
    public List<SedeSstDto> listarSedes(String nit) {
        String sql = """
            SELECT
                   LTRIM(RTRIM(direccion)) AS direccion,
                   LTRIM(RTRIM(departamento)) AS departamento,
                   LTRIM(RTRIM(municipio)) AS municipio,
                   LTRIM(RTRIM(codigo_postal)) AS codigo_postal,
                   MIN(fecha_registro) AS fecha_registro,
                   STRING_AGG(CAST(LTRIM(RTRIM(servicio_no_reps)) AS NVARCHAR(MAX)), ', ') AS servicios_sst
            FROM dbo.registro_prestadores
            WHERE LTRIM(RTRIM(nit)) = LTRIM(RTRIM(?))
              AND (
                   UPPER(LTRIM(RTRIM(tipo_registro))) = 'SST'
                OR UPPER(LTRIM(RTRIM(servicio))) = 'SST'
              )
            GROUP BY LTRIM(RTRIM(direccion)), LTRIM(RTRIM(departamento)), LTRIM(RTRIM(municipio)), LTRIM(RTRIM(codigo_postal))
            ORDER BY fecha_registro DESC
            """;
        return jdbcTemplate.query(sql, new SedeRowMapper(), nit);
    }

    public record SedeSstDto(String direccion, String departamentoId, String municipioId, String codigoPostal, LocalDateTime fechaRegistro, String serviciosSst) {}

    private static class SedeRowMapper implements RowMapper<SedeSstDto> {
        @Override
        public SedeSstDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new SedeSstDto(
                    rs.getString("direccion"),
                    rs.getString("departamento"),
                    rs.getString("municipio"),
                    rs.getString("codigo_postal"),
                    rs.getTimestamp("fecha_registro") != null ? rs.getTimestamp("fecha_registro").toLocalDateTime() : null,
                    rs.getString("servicios_sst")
            );
        }
    }

    private String construirDireccion(RegistroSstRequest.SedeSst sede) {
        StringBuilder dir = new StringBuilder();
        dir.append(sede.getTipoVia()).append(" ").append(sede.getNumeroVia());
        if (sede.getLetraVia() != null && !sede.getLetraVia().isBlank()) {
            dir.append(" ").append(sede.getLetraVia());
        }
        dir.append(" # ").append(sede.getNumeroPlaca());
        return dir.toString().trim();
    }
}
