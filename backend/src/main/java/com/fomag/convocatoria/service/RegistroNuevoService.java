package com.fomag.convocatoria.service;

import com.fomag.convocatoria.api.dto.RegistroNuevoRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class RegistroNuevoService {

    private final JdbcTemplate jdbcTemplate;

    private static final String INSERT_SQL = """
        INSERT INTO dbo.registro_prestadores
        (nit, nombre_prestador, clase_prestador, telefono_fijo, celular_admin, correo_admin,
         representante_legal, correo_representante, celular_representante,
         direccion, departamento, municipio, servicio, servicio_no_reps, codigo_postal,
         transporte, insumos_medicos, medicamentos, fecha_registro)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
        """;

    @Transactional
    public void registrarNuevo(RegistroNuevoRequest request) {
        for (RegistroNuevoRequest.SedeNueva sede : request.getSedes()) {
            String direccionCompleta = construirDireccion(sede);
            Object[] params = new Object[]{
                    request.getNit(),
                    request.getNombrePrestador(),
                    request.getClasePrestador(),
                    request.getTelefonoFijo(),
                    request.getCelularAdmin(),
                    request.getCorreoAdmin(),
                    request.getRepresentanteLegal(),
                    request.getCorreoRepresentante(),
                    request.getCelularRepresentante(),
                    direccionCompleta,
                    sede.getDepartamentoId(),
                    sede.getMunicipioId(),
                    "001705", // servicio fijo
                    sede.getServiciosNoReps(),
                    sede.getCodigoPostal(),
                    request.isTransporte() ? 1 : 0,
                    request.isInsumosMedicos() ? 1 : 0,
                    request.isMedicamentos() ? 1 : 0
            };

            try {
                jdbcTemplate.update(INSERT_SQL, params);
            } catch (DataAccessException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al registrar la sede " + direccionCompleta, e);
            }
        }
    }

    private String construirDireccion(RegistroNuevoRequest.SedeNueva sede) {
        StringBuilder dir = new StringBuilder();
        dir.append(sede.getTipoVia()).append(" ").append(sede.getNumeroVia());
        if (sede.getLetraVia() != null && !sede.getLetraVia().isBlank()) {
            dir.append(" ").append(sede.getLetraVia());
        }
        dir.append(" # ").append(sede.getNumeroPlaca());
        return dir.toString().trim();
    }
}
