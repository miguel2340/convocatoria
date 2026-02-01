package com.fomag.convocatoria.service;

import com.fomag.convocatoria.api.dto.ActualizarAtencionRequest;
import com.fomag.convocatoria.api.dto.AtencionSedeDto;
import com.fomag.convocatoria.api.dto.AtencionSedeEstadoDto;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AtencionService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<AtencionSedeEstadoDto> listarSedes(String nit) {
        String sql = """
            WITH RP AS (
                SELECT
                    cod_habilitacion = LTRIM(RTRIM(rp.cod_habilitacion)),
                    direccion_rp     = MAX(rp.direccion),
                    departamento_rp  = MAX(rp.departamento),
                    municipio_rp     = MAX(rp.municipio)
                FROM dbo.registro_prestadores rp
                WHERE LTRIM(RTRIM(rp.nit)) = LTRIM(RTRIM(?))
                  AND NULLIF(LTRIM(RTRIM(rp.cod_habilitacion)),'') IS NOT NULL
                GROUP BY LTRIM(RTRIM(rp.cod_habilitacion))
            )
            SELECT
                rp.cod_habilitacion,
                direccion    = COALESCE(NULLIF(LTRIM(RTRIM(au.direccion)) ,''), rp.direccion_rp),
                departamento = COALESCE(NULLIF(LTRIM(RTRIM(au.departamento)) ,''), rp.departamento_rp),
                municipio    = COALESCE(NULLIF(LTRIM(RTRIM(au.municipio)) ,''), rp.municipio_rp),
                estado = CASE
                    WHEN au.id IS NULL THEN 'SEDE_NUEVA'
                    WHEN (
                        COALESCE(LTRIM(RTRIM(au.direccion)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.departamento)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.municipio)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.mecanismo_citas)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.correo_autorizado)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.telefono_fijo)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.celular)),'') = '' AND
                        au.horario_desde IS NULL AND au.horario_hasta IS NULL AND
                        COALESCE(LTRIM(RTRIM(au.whatsapp)),'') = '' AND
                        au.horario_whatsapp_desde IS NULL AND au.horario_whatsapp_hasta IS NULL AND
                        COALESCE(LTRIM(RTRIM(au.linea_telefonica)),'') = '' AND
                        au.horario_telefono_desde IS NULL AND au.horario_telefono_hasta IS NULL AND
                        COALESCE(LTRIM(RTRIM(au.pagina_web)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.correo_no_presencial)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.nombre_coordinador)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.telefono_coordinador)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.correo_coordinador)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.nombre_gerente)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.correo_gerente)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.celular_gerente)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.correo_administrativo)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.telefono_administrativo)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.celular_administrativo)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.Ambulatorio)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.Hospitalario)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.Domiciliario)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.Transporte)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.Insumos)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.Servicio_Exclusivo)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.Servicio_Agenda)),'') = '' AND
                        COALESCE(LTRIM(RTRIM(au.Servicio_Franjas)),'') = ''
                    ) THEN 'SIN_DILIGENCIAR'
                    ELSE 'COMPLETA'
                END
            FROM RP rp
            OUTER APPLY (
              SELECT TOP (1) *
              FROM AtencionUsuarios au
              WHERE LTRIM(RTRIM(au.nit)) = LTRIM(RTRIM(?))
                AND LTRIM(RTRIM(au.cod_habilitacion)) = rp.cod_habilitacion
              ORDER BY au.id DESC
            ) au
            ORDER BY rp.cod_habilitacion
            """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> AtencionSedeEstadoDto.builder()
                .codHabilitacion(rs.getString("cod_habilitacion"))
                .direccion(rs.getString("direccion"))
                .departamento(rs.getString("departamento"))
                .municipio(rs.getString("municipio"))
                .estado(rs.getString("estado"))
                .build(), nit, nit);
    }

    @Transactional(readOnly = true)
    public AtencionSedeDto obtenerSede(String nit, String cod) {
        String sql = """
            SELECT TOP 1 * FROM AtencionUsuarios
            WHERE LTRIM(RTRIM(nit)) = LTRIM(RTRIM(?))
              AND LTRIM(RTRIM(cod_habilitacion)) = LTRIM(RTRIM(?))
            ORDER BY id DESC
            """;
        return jdbcTemplate.query(sql, rs -> rs.next() ? mapSede(rs) : null, nit, cod);
    }

    @Transactional
    public void guardar(ActualizarAtencionRequest request) {
        // Si existe, tomamos id; si no, insertaremos
        Integer id = jdbcTemplate.query("""
            SELECT TOP 1 id FROM AtencionUsuarios
             WHERE LTRIM(RTRIM(nit)) = LTRIM(RTRIM(?))
               AND LTRIM(RTRIM(cod_habilitacion)) = LTRIM(RTRIM(?))
             ORDER BY id DESC
             """, rs -> rs.next() ? rs.getInt("id") : null, request.getNit(), request.getCodHabilitacion());

        if (id == null) {
            insertar(request);
        } else {
            actualizar(id, request);
        }
    }

    private void insertar(ActualizarAtencionRequest r) {
        String sql = """
            INSERT INTO AtencionUsuarios
            (nit, cod_habilitacion, direccion, departamento, municipio, mecanismo_citas,
             correo_autorizado, telefono_fijo, celular, horario_desde, horario_hasta,
             whatsapp, horario_whatsapp_desde, horario_whatsapp_hasta, linea_telefonica,
             horario_telefono_desde, horario_telefono_hasta, pagina_web, correo_no_presencial,
             nombre_coordinador, telefono_coordinador, correo_coordinador,
             nombre_gerente, correo_gerente, celular_gerente,
             correo_administrativo, telefono_administrativo, celular_administrativo,
             Ambulatorio, Hospitalario, Domiciliario, Transporte, Insumos,
             Servicio_Exclusivo, Servicio_Agenda, Servicio_Franjas, fecha_registro)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,GETDATE())
            """;
        ejecutarUpsert(sql, null, r);
    }

    private void actualizar(Integer id, ActualizarAtencionRequest r) {
        String sql = """
            UPDATE AtencionUsuarios SET
             direccion=?, departamento=?, municipio=?, mecanismo_citas=?,
             correo_autorizado=?, telefono_fijo=?, celular=?, horario_desde=?, horario_hasta=?,
             whatsapp=?, horario_whatsapp_desde=?, horario_whatsapp_hasta=?, linea_telefonica=?,
             horario_telefono_desde=?, horario_telefono_hasta=?, pagina_web=?, correo_no_presencial=?,
             nombre_coordinador=?, telefono_coordinador=?, correo_coordinador=?,
             nombre_gerente=?, correo_gerente=?, celular_gerente=?,
             correo_administrativo=?, telefono_administrativo=?, celular_administrativo=?,
             Ambulatorio=?, Hospitalario=?, Domiciliario=?, Transporte=?, Insumos=?,
             Servicio_Exclusivo=?, Servicio_Agenda=?, Servicio_Franjas=?
            WHERE id=?
            """;
        ejecutarUpsert(sql, id, r);
    }

    private void ejecutarUpsert(String sql, Integer id, ActualizarAtencionRequest r) {
        Object[] params = new Object[]{
                r.getDireccion(), r.getDepartamento(), r.getMunicipio(), r.getMecanismoCitas(),
                r.getCorreoAutorizado(), r.getTelefonoFijo(), r.getCelular(), r.getHorarioDesde(), r.getHorarioHasta(),
                r.getWhatsapp(), r.getHorarioWhatsappDesde(), r.getHorarioWhatsappHasta(), r.getLineaTelefonica(),
                r.getHorarioTelefonoDesde(), r.getHorarioTelefonoHasta(), r.getPaginaWeb(), r.getCorreoNoPresencial(),
                r.getNombreCoordinador(), r.getTelefonoCoordinador(), r.getCorreoCoordinador(),
                r.getNombreGerente(), r.getCorreoGerente(), r.getCelularGerente(),
                r.getCorreoAdministrativo(), r.getTelefonoAdministrativo(), r.getCelularAdministrativo(),
                r.isAmbulatorio() ? "Sí" : "No",
                r.isHospitalario() ? "Sí" : "No",
                r.isDomiciliario() ? "Sí" : "No",
                r.isTransporte() ? "Sí" : "No",
                r.isInsumos() ? "Sí" : "No",
                r.isServicioExclusivo() ? "Sí" : "No",
                r.isServicioAgenda() ? "Sí" : "No",
                r.isServicioFranjas() ? "Sí" : "No"
        };
        try {
            if (id == null) {
                Object[] full = new Object[]{
                        r.getNit(), r.getCodHabilitacion(),
                };
                // combine
                Object[] finalParams = new Object[full.length + params.length];
                System.arraycopy(full, 0, finalParams, 0, full.length);
                System.arraycopy(params, 0, finalParams, full.length, params.length);
                jdbcTemplate.update(sql, finalParams);
            } else {
                Object[] finalParams = new Object[params.length + 1];
                System.arraycopy(params, 0, finalParams, 0, params.length);
                finalParams[params.length] = id;
                jdbcTemplate.update(sql, finalParams);
            }
        } catch (DataAccessException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar atención usuario", e);
        }
    }

    private AtencionSedeDto mapSede(ResultSet rs) throws SQLException {
        return AtencionSedeDto.builder()
                .codHabilitacion(rs.getString("cod_habilitacion"))
                .direccion(rs.getString("direccion"))
                .departamento(rs.getString("departamento"))
                .municipio(rs.getString("municipio"))
                .mecanismoCitas(rs.getString("mecanismo_citas"))
                .correoAutorizado(rs.getString("correo_autorizado"))
                .telefonoFijo(rs.getString("telefono_fijo"))
                .celular(rs.getString("celular"))
                .horarioDesde(toHora(rs.getString("horario_desde")))
                .horarioHasta(toHora(rs.getString("horario_hasta")))
                .whatsapp(rs.getString("whatsapp"))
                .horarioWhatsappDesde(toHora(rs.getString("horario_whatsapp_desde")))
                .horarioWhatsappHasta(toHora(rs.getString("horario_whatsapp_hasta")))
                .lineaTelefonica(rs.getString("linea_telefonica"))
                .horarioTelefonoDesde(toHora(rs.getString("horario_telefono_desde")))
                .horarioTelefonoHasta(toHora(rs.getString("horario_telefono_hasta")))
                .paginaWeb(rs.getString("pagina_web"))
                .correoNoPresencial(rs.getString("correo_no_presencial"))
                .nombreCoordinador(rs.getString("nombre_coordinador"))
                .telefonoCoordinador(rs.getString("telefono_coordinador"))
                .correoCoordinador(rs.getString("correo_coordinador"))
                .nombreGerente(rs.getString("nombre_gerente"))
                .correoGerente(rs.getString("correo_gerente"))
                .celularGerente(rs.getString("celular_gerente"))
                .correoAdministrativo(rs.getString("correo_administrativo"))
                .telefonoAdministrativo(rs.getString("telefono_administrativo"))
                .celularAdministrativo(rs.getString("celular_administrativo"))
                .ambulatorio(esSi(rs.getString("Ambulatorio")))
                .hospitalario(esSi(rs.getString("Hospitalario")))
                .domiciliario(esSi(rs.getString("Domiciliario")))
                .transporte(esSi(rs.getString("Transporte")))
                .insumos(esSi(rs.getString("Insumos")))
                .servicioExclusivo(esSi(rs.getString("Servicio_Exclusivo")))
                .servicioAgenda(esSi(rs.getString("Servicio_Agenda")))
                .servicioFranjas(esSi(rs.getString("Servicio_Franjas")))
                .build();
    }

    private boolean esSi(String val) {
        return val != null && val.trim().equalsIgnoreCase("sí") || val.trim().equalsIgnoreCase("si") || val.trim().equalsIgnoreCase("1");
    }

    private String toHora(String valor) {
        if (valor == null) return null;
        if (valor.length() >= 5) return valor.substring(0, 5);
        return valor;
    }
}
