package com.fomag.convocatoria.service;

import com.fomag.convocatoria.api.dto.DireccionServiciosDto;
import com.fomag.convocatoria.api.dto.RegistroServiciosRequest;
import com.fomag.convocatoria.api.dto.ServicioDto;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiciosService {

    private final JdbcTemplate jdbcTemplate;

    private static final String CONSULTA_SERVICIOS = """
            select distinct
                p.razon_social,
                p.nits_nit,
                s.cod_sede,
                s.direccion,
                se.serv_codigo,
                ser.serv_nombre,
                ser.grupo,
                s.cod_municipio,
                m.municipio,
                s.cod_departamento,
                d.departamento
            from prestadores p
            inner join sedes_reps s on p.nits_nit = s.nits_nit
            inner join servicios_prestadores_reps se on s.cod_sede = se.cod_sede
            inner join servicios ser on se.serv_codigo = ser.serv_codigo
            inner join municipios m on m.id_municipio = s.cod_municipio
            inner join departamentos d on d.id_departamento = s.cod_departamento
            where p.nits_nit = ?
            """;

    @Transactional(readOnly = true)
    public List<DireccionServiciosDto> obtenerServiciosPorNit(String nit) {
        // Servicios del REPS
        List<ServicioDto> flat = jdbcTemplate.query(CONSULTA_SERVICIOS, new ServicioMapper(), nit);

        // Servicios ya registrados en nuestra tabla
        Set<String> registrados = new HashSet<>();
        List<Map<String, Object>> filas = jdbcTemplate.queryForList(
                "SELECT LTRIM(RTRIM(cod_habilitacion)) AS cod_habilitacion, LTRIM(RTRIM(servicio)) AS servicio FROM dbo.registro_prestadores WHERE nit = ?",
                nit
        );
        for (Map<String, Object> fila : filas) {
            String key = Optional.ofNullable(fila.get("cod_habilitacion")).orElse("").toString().trim() + "|" +
                    Optional.ofNullable(fila.get("servicio")).orElse("").toString().trim();
            registrados.add(key);
        }

        flat = flat.stream()
                .map(s -> {
                    String key = s.getCodHabilitacion().trim() + "|" + s.getCodigo().trim();
                    return s.toBuilder().yaRegistrado(registrados.contains(key)).build();
                })
                .toList();

        Map<String, List<ServicioDto>> agrupado = flat.stream()
                .collect(Collectors.groupingBy(s -> s.getCodHabilitacion() + "|" + s.getDepartamento() + "|" + s.getMunicipio() + "|" + s.getDireccion()));

        List<DireccionServiciosDto> resultado = new ArrayList<>();
        for (Map.Entry<String, List<ServicioDto>> entry : agrupado.entrySet()) {
            ServicioDto base = entry.getValue().get(0);
            resultado.add(DireccionServiciosDto.builder()
                    .codHabilitacion(base.getCodHabilitacion())
                    .direccion(base.getDireccion())
                    .departamento(base.getDepartamento())
                    .municipio(base.getMunicipio())
                    .servicios(entry.getValue())
                    .build());
        }
        return resultado;
    }

    @Transactional
    public void registrarServicios(RegistroServiciosRequest request) {
        // Registrar evento
        registrarEvento(request.getNit(), request.getRepresentanteLegal());

        String insertSql = """
            INSERT INTO dbo.registro_prestadores
            (nit, nombre_prestador, clase_prestador, telefono_fijo, celular_admin, correo_admin,
             representante_legal, correo_representante, celular_representante, cod_habilitacion,
             direccion, departamento, municipio, servicio, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
            """;

        for (RegistroServiciosRequest.ServicioPayload servicio : request.getServicios()) {
            Object[] params = new Object[]{
                    request.getNit(),
                    request.getNombre(),
                    request.getClasePrestador(),
                    request.getTelefonoFijo(),
                    request.getCelularAdmin(),
                    request.getCorreoAdmin(),
                    request.getRepresentanteLegal(),
                    request.getCorreoRepresentante(),
                    request.getCelularRepresentante(),
                    servicio.getCodHabilitacion(),
                    servicio.getDireccion(),
                    servicio.getDepartamento(),
                    servicio.getMunicipio(),
                    servicio.getCodigo()
            };
            try {
                jdbcTemplate.update(insertSql, params);
            } catch (DataAccessException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al insertar servicio", e);
            }
        }
    }

    private void registrarEvento(String nit, String representanteLegal) {
        Integer total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) AS total FROM evento_registro WHERE nit = ?",
                Integer.class,
                nit
        );
        String evento = (total != null && total > 0) ? "actualizacion_registro" : "registro";
        jdbcTemplate.update(
                "INSERT INTO evento_registro (nit, nombre_representante, evento, fecha) VALUES (?, ?, ?, GETDATE())",
                nit, representanteLegal, evento
        );
    }

    private static class ServicioMapper implements RowMapper<ServicioDto> {
        @Override
        public ServicioDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            return ServicioDto.builder()
                    .codigo(rs.getString("serv_codigo"))
                    .nombre(rs.getString("serv_nombre"))
                    .grupo(rs.getString("grupo"))
                    .codHabilitacion(rs.getString("cod_sede"))
                    .direccion(rs.getString("direccion"))
                    .departamento(rs.getString("departamento"))
                    .municipio(rs.getString("municipio"))
                    .build();
        }
    }
}
