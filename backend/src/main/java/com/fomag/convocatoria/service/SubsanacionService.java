package com.fomag.convocatoria.service;

import com.fomag.convocatoria.api.dto.ArchivoDto;
import com.fomag.convocatoria.api.dto.SubsanacionEvaluacionItem;
import com.fomag.convocatoria.api.dto.SubsanacionEvaluacionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubsanacionService {

    private final JdbcTemplate jdbcTemplate;

    private static final String BASE_DIR = "E:\\\\subsanacion\\\\";
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public SubsanacionEvaluacionResponse obtenerEvaluacion(String nit) {
        boolean esPrimeraEtapa = esPrimeraEtapa(nit);

        String sql = """
                SELECT * FROM (
                    SELECT 
                        f.nit,
                        'FINANCIERO' as tipo_calificacion,
                        f.id_item,
                        i.numero,
                        i.documento_revisar,
                        i.descripcion,
                        f.resultado,
                        f.fecha_evaluacion,
                        f.observacion
                    FROM financiero_calificaciones f
                    INNER JOIN financiero_items i ON f.id_item = i.id
                    WHERE f.resultado = 'NO CUMPLE'
                      AND f.nit = ?
                      AND f.nit IN (
                          SELECT nit FROM dbo.registro_prestadores WHERE fecha_registro >= '2025-06-06'
                      )
            
                    UNION ALL
            
                    SELECT 
                        t.nit,
                        'TECNICO' as tipo_calificacion,
                        t.id_item,
                        i.numero,
                        i.documento_revisar,
                        i.descripcion,
                        t.resultado,
                        t.fecha_evaluacion,
                        t.observacion
                    FROM tecnico_calificaciones t
                    INNER JOIN tecnico_items i ON t.id_item = i.id
                    WHERE t.resultado = 'NO CUMPLE'
                      AND t.nit = ?
                      AND t.nit IN (
                          SELECT nit FROM dbo.registro_prestadores WHERE fecha_registro >= '2025-06-06'
                      )
            
                    UNION ALL
            
                    SELECT 
                        j.nit,
                        'JURIDICO' as tipo_calificacion,
                        j.id_item,
                        i.numero,
                        i.documento_revisar,
                        i.descripcion,
                        j.resultado,
                        j.fecha_evaluacion,
                        j.observacion
                    FROM juridico_calificaciones j
                    INNER JOIN juridico_items i ON j.id_item = i.id
                    WHERE j.resultado = 'NO CUMPLE'
                      AND j.nit = ?
                      AND j.nit IN (
                          SELECT nit FROM dbo.registro_prestadores WHERE fecha_registro >= '2025-06-06'
                      )
                ) AS q
                ORDER BY nit, tipo_calificacion, id_item
                """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, nit, nit, nit);
        List<SubsanacionEvaluacionItem> items = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            items.add(SubsanacionEvaluacionItem.builder()
                    .tipoCalificacion(safeString(row.get("tipo_calificacion")))
                    .numero(safeString(row.get("numero")))
                    .documentoRevisar(safeString(row.get("documento_revisar")))
                    .descripcion(safeString(row.get("descripcion")))
                    .resultado(safeString(row.get("resultado")))
                    .fechaEvaluacion(formatFecha(row.get("fecha_evaluacion")))
                    .observacion(safeString(row.get("observacion")))
                    .build());
        }

        return SubsanacionEvaluacionResponse.builder()
                .etapa(esPrimeraEtapa ? "PRIMERA" : "SEGUNDA")
                .items(items)
                .build();
    }

    private boolean esPrimeraEtapa(String nit) {
        try {
            LocalDateTime fecha = jdbcTemplate.queryForObject(
                    "SELECT TOP 1 fecha_registro FROM dbo.registro_prestadores WHERE nit = ? ORDER BY fecha_registro DESC",
                    LocalDateTime.class,
                    nit
            );
            if (fecha == null) return false;
            return fecha.isBefore(LocalDateTime.of(2025, 6, 1, 0, 0));
        } catch (DataAccessException e) {
            log.warn("No se pudo obtener fecha_registro para nit {}", nit, e);
            return false;
        }
    }

    public List<ArchivoDto> listarSoportes(String nit) {
        Path dir = Paths.get(BASE_DIR, nit);
        if (!Files.exists(dir)) return List.of();
        try {
            return Files.list(dir)
                    .filter(Files::isRegularFile)
                    .map(p -> {
                        try {
                            return ArchivoDto.builder()
                                    .nombre(p.getFileName().toString())
                                    .tamano(Files.size(p))
                                    .modificado(FMT.format(Files.getLastModifiedTime(p).toInstant()
                                            .atZone(java.time.ZoneId.systemDefault())
                                            .toLocalDateTime()))
                                    .build();
                        } catch (IOException e) {
                            return ArchivoDto.builder()
                                    .nombre(p.getFileName().toString())
                                    .tamano(0)
                                    .modificado("")
                                    .build();
                        }
                    })
                    .toList();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo listar soportes", e);
        }
    }

    public void subirSoportes(String nit, MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se enviaron archivos");
        }
        Path dir = Paths.get(BASE_DIR, nit);
        try {
            Files.createDirectories(dir);
            for (MultipartFile mf : files) {
                String nombreSeguro = Optional.ofNullable(mf.getOriginalFilename())
                        .map(n -> n.replaceAll("[^a-zA-Z0-9_.-]", "_"))
                        .orElse("soporte");
                Path destino = dir.resolve(nombreSeguro);
                mf.transferTo(destino);
            }
            upsertSubsanacion(nit);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error guardando archivos", e);
        }
    }

    public void eliminarSoporte(String nit, String archivo) {
        if (archivo == null || archivo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Archivo no especificado");
        }
        Path path = Paths.get(BASE_DIR, nit, archivo);
        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo eliminar el archivo", e);
        }
    }

    private void upsertSubsanacion(String nit) {
        LocalDateTime ahora = LocalDateTime.now();
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM subsanacion WHERE nit = ?",
                Integer.class,
                nit
        );
        if (count != null && count > 0) {
            jdbcTemplate.update("UPDATE subsanacion SET fecha_subsanacion = ? WHERE nit = ?", ahora, nit);
        } else {
            jdbcTemplate.update("INSERT INTO subsanacion (nit, fecha_subsanacion) VALUES (?, ?)", nit, ahora);
        }
    }

    private String safeString(Object o) {
        return o == null ? "" : o.toString();
    }

    private String formatFecha(Object o) {
        if (o == null) return "";
        if (o instanceof LocalDateTime ldt) return FMT.format(ldt);
        return o.toString();
    }
}
