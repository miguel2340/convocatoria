package com.fomag.convocatoria.service;

import com.fomag.convocatoria.persistence.entity.ClaveNitEntity;
import com.fomag.convocatoria.persistence.repository.ClaveNitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AccesoService {

    public enum Modo { CREAR, INGRESAR }

    public record EstadoAcceso(String nit, Modo modo) {}

    private final ClaveNitRepository claveNitRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    private record Desafio(String nit, String representante, String correo, String celular, String correoAdmin, Instant expira) {}

    private final Map<String, Desafio> desafios = new ConcurrentHashMap<>();
    private final Map<String, String> tokensRecuperacion = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public EstadoAcceso estado(String nit) {
        boolean existe = claveNitRepository.existsById(nit);
        return new EstadoAcceso(nit, existe ? Modo.INGRESAR : Modo.CREAR);
    }

    @Transactional
    public void crearClave(String nit, String clave) {
        if (claveNitRepository.existsById(nit)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una clave para este NIT");
        }
        ClaveNitEntity entity = new ClaveNitEntity();
        entity.setNit(nit);
        entity.setClave(passwordEncoder.encode(clave));
        claveNitRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public void validarIngreso(String nit, String clave) {
        ClaveNitEntity entity = claveNitRepository.findById(nit)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Clave incorrecta"));

        if (!passwordEncoder.matches(clave, entity.getClave())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Clave incorrecta");
        }
    }

    @Transactional(readOnly = true)
    public RecuperacionPreguntas obtenerPreguntas(String nit) {
        var data = jdbcTemplate.query("""
                SELECT TOP 1 representante_legal, correo_representante, celular_representante, correo_admin
                FROM dbo.registro_prestadores
                WHERE LTRIM(RTRIM(nit)) = LTRIM(RTRIM(?))
                ORDER BY fecha_registro DESC
                """, rs -> rs.next() ? new String[]{
                        rs.getString("representante_legal"),
                        rs.getString("correo_representante"),
                        rs.getString("celular_representante"),
                        rs.getString("correo_admin")
                } : null, nit);

        if (data == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "NIT no encontrado");
        }

        String representante = safe(data[0]);
        String correo = safe(data[1]);
        String celular = safe(data[2]);
        String correoAdmin = safe(data[3]);

        String desafioId = UUID.randomUUID().toString();
        Instant expira = Instant.now().plus(15, ChronoUnit.MINUTES);
        desafios.put(desafioId, new Desafio(nit, representante, correo, celular, correoAdmin, expira));

        return new RecuperacionPreguntas(
                desafioId,
                List.of(
                        new Pregunta("representante", "¿Quién es el representante legal?", opciones("representante_legal", representante)),
                        new Pregunta("correo", "¿Cuál es el correo del representante?", opciones("correo_representante", correo)),
                        new Pregunta("celular", "¿Cuál es el celular del representante?", opciones("celular_representante", celular))
                )
        );
    }

    @Transactional(readOnly = true)
    public RecuperacionValidacion validarPreguntas(String nit, String desafioId, Map<String, String> respuestas) {
        Desafio desafio = desafios.get(desafioId);
        if (desafio == null || desafio.expira.isBefore(Instant.now()) || !desafio.nit.equals(nit)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Desafío inválido o expirado");
        }
        if (!match(respuestas.get("representante"), desafio.representante)
                || !match(respuestas.get("correo"), desafio.correo)
                || !match(respuestas.get("celular"), desafio.celular)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Respuestas incorrectas");
        }
        String token = UUID.randomUUID().toString();
        tokensRecuperacion.put(token, nit);
        return new RecuperacionValidacion(
                token,
                new DatosRepresentante(desafio.representante, desafio.correo, desafio.celular, desafio.correoAdmin)
        );
    }

    @Transactional
    public void restablecerClave(String tokenRecuperacion, String clave) {
        String nit = tokensRecuperacion.remove(tokenRecuperacion);
        if (nit == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de recuperación inválido");
        }
        ClaveNitEntity entity = claveNitRepository.findById(nit).orElseGet(() -> {
            ClaveNitEntity e = new ClaveNitEntity();
            e.setNit(nit);
            return e;
        });
        entity.setClave(passwordEncoder.encode(clave));
        claveNitRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public String validarTokenRecuperacion(String tokenRecuperacion) {
        String nit = tokensRecuperacion.get(tokenRecuperacion);
        if (nit == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de recuperación inválido");
        }
        return nit;
    }

    private boolean match(String respuesta, String correcta) {
        return safe(respuesta).equalsIgnoreCase(safe(correcta));
    }

    private String safe(String val) {
        return val == null ? "" : val.trim();
    }

    private List<String> opciones(String columna, String correcta) {
        List<String> opciones = new ArrayList<>();
        String sql = "SELECT TOP 10 " + columna + " AS val FROM dbo.registro_prestadores " +
                "WHERE " + columna + " IS NOT NULL AND LTRIM(RTRIM(" + columna + ")) <> ? ORDER BY NEWID()";
        jdbcTemplate.query(sql, rs -> {
            String v = safe(rs.getString("val"));
            if (!v.isEmpty()) opciones.add(v);
        }, correcta);
        opciones.add(correcta);
        // eliminar duplicados y mezclar
        List<String> unicos = new ArrayList<>(new LinkedHashSet<>(opciones));
        Collections.shuffle(unicos);
        return unicos;
    }

    public record Pregunta(String id, String texto, List<String> opciones) {}

    public record RecuperacionPreguntas(String desafioId, List<Pregunta> preguntas) {}

    public record DatosRepresentante(String representanteLegal, String correoRepresentante, String celularRepresentante, String correoAdmin) {}

    public record RecuperacionValidacion(String tokenRecuperacion, DatosRepresentante representante) {}
}
