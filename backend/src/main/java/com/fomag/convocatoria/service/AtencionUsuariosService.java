package com.fomag.convocatoria.service;

import com.fomag.convocatoria.api.dto.AtencionUsuariosRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AtencionUsuariosService {

    private final JdbcTemplate jdbcTemplate;

    private static final String INSERT_SQL = """
        INSERT INTO AtencionUsuarios (
            nit, cod_habilitacion, direccion, departamento, municipio, mecanismo_citas,
            correo_autorizado, telefono_fijo, celular, horario_desde, horario_hasta,
            whatsapp, horario_whatsapp_desde, horario_whatsapp_hasta, linea_telefonica,
            horario_telefono_desde, horario_telefono_hasta, pagina_web, correo_no_presencial,
            nombre_coordinador, telefono_coordinador, correo_coordinador, fecha_registro,
            nombre_gerente, correo_gerente, celular_gerente, correo_administrativo,
            telefono_administrativo, celular_administrativo,
            Ambulatorio, Hospitalario, Domiciliario, Transporte, Insumos,
            Servicio_Exclusivo, Servicio_Agenda, Servicio_Franjas
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(),
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        """;

    @Transactional
    public void registrar(AtencionUsuariosRequest request) {
        List<AtencionUsuariosRequest.SedeRequest> sedes = request.getSedes();

        for (AtencionUsuariosRequest.SedeRequest sede : sedes) {
            Object[] params = buildParams(request.getNit(), sede);
            try {
                jdbcTemplate.update(INSERT_SQL, params);
            } catch (DataAccessException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar la informacion de atencion a usuarios", e);
            }
        }
    }

    private Object[] buildParams(String nit, AtencionUsuariosRequest.SedeRequest sede) {
        AtencionUsuariosRequest.HorarioRequest presencial = sede.getHorarioPresencial();
        AtencionUsuariosRequest.HorarioRequest horarioWhatsapp = sede.getHorarioWhatsapp();
        AtencionUsuariosRequest.HorarioRequest horarioTelefono = sede.getHorarioTelefono();
        AtencionUsuariosRequest.GerenteRequest gerente = sede.getGerente();
        AtencionUsuariosRequest.CoordinadorRequest coordinador = sede.getCoordinador();
        List<String> tipos = sede.getTipoServicio();

        return new Object[]{
                nit,
                sede.getCodHabilitacion(),
                sede.getDireccion(),
                sede.getDepartamento(),
                sede.getMunicipio(),
                sede.getMecanismoCitas(),
                gerente != null ? gerente.getCorreoAutorizado() : null,
                gerente != null ? gerente.getTelefonoFijo() : null,
                gerente != null ? gerente.getCelular() : null,
                presencial != null ? presencial.getDesde() : null,
                presencial != null ? presencial.getHasta() : null,
                sede.getWhatsapp(),
                horarioWhatsapp != null ? horarioWhatsapp.getDesde() : null,
                horarioWhatsapp != null ? horarioWhatsapp.getHasta() : null,
                sede.getLineaTelefonica(),
                horarioTelefono != null ? horarioTelefono.getDesde() : null,
                horarioTelefono != null ? horarioTelefono.getHasta() : null,
                sede.getPaginaWeb(),
                sede.getCorreoNoPresencial(),
                coordinador != null ? coordinador.getNombre() : null,
                coordinador != null ? coordinador.getTelefono() : null,
                coordinador != null ? coordinador.getCorreo() : null,
                gerente != null ? gerente.getNombre() : null,
                gerente != null ? gerente.getCorreoGerente() : null,
                gerente != null ? gerente.getCelularGerente() : null,
                gerente != null ? gerente.getCorreoAdministrativo() : null,
                gerente != null ? gerente.getTelefonoAdministrativo() : null,
                gerente != null ? gerente.getCelularAdministrativo() : null,
                toSiNo(tipos, "Ambulatorio"),
                toSiNo(tipos, "Hospitalario"),
                toSiNo(tipos, "Domiciliario"),
                toSiNo(tipos, "Transporte"),
                toSiNo(tipos, "Insumos"),
                sede.isServicioExclusivo() ? "Si" : "No",
                sede.isServicioAgenda() ? "Si" : "No",
                sede.isServicioFranjas() ? "Si" : "No"
        };
    }

    private String toSiNo(List<String> tipos, String valor) {
        return (tipos != null && tipos.contains(valor)) ? "Si" : "No";
    }
}
