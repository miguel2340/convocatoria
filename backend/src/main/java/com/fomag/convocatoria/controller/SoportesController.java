package com.fomag.convocatoria.controller;

import com.fomag.convocatoria.api.ApiResponse;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/soportes")
public class SoportesController {

    private static final Path BASE_PATH = Paths.get("C:/soportes");
    private static final Path BASE_PATH_SST = Paths.get("C:/soportes_sst");

    @GetMapping("/check")
    public ApiResponse<SoporteInfo> check(
            @RequestParam("nit") @NotBlank String nit,
            @RequestParam(value = "tipo", required = false) String tipo) {
        String nitSafe = nit.replaceAll("[^0-9]", "");
        Path base = resolveBase(tipo);
        Path carpeta = base.resolve(nitSafe);
        boolean existe = Files.isDirectory(carpeta);
        int cantidad = 0;
        if (existe) {
            try {
                cantidad = (int) Files.list(carpeta).filter(Files::isRegularFile).count();
            } catch (IOException ignored) {
            }
        }
        SoporteInfo data = new SoporteInfo(existe, cantidad, carpeta.toString());
        return ApiResponse.<SoporteInfo>builder().data(data).build();
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> upload(
            @RequestParam("nit") @NotBlank String nit,
            @RequestParam(value = "tipo", required = false) String tipo,
            @RequestParam("files") List<MultipartFile> files) {
        String nitSafe = nit.replaceAll("[^0-9]", "");
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.<String>builder()
                            .error(ApiResponse.ErrorData.builder()
                                    .code("NO_FILES")
                                    .message("No se recibieron archivos").build())
                            .build());
        }

        Path carpeta = resolveBase(tipo).resolve(nitSafe);
        try {
            if (!Files.exists(carpeta)) {
                Files.createDirectories(carpeta);
            }
            for (MultipartFile file : files) {
                if (file.isEmpty() || !StringUtils.hasText(file.getOriginalFilename())) {
                    continue;
                }
                Path destino = carpeta.resolve(file.getOriginalFilename());
                Files.copy(file.getInputStream(), destino, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    ApiResponse.<String>builder()
                            .error(ApiResponse.ErrorData.builder()
                                    .code("UPLOAD_ERROR")
                                    .message("Error al guardar los archivos").build())
                            .build());
        }

        return ResponseEntity.ok(ApiResponse.<String>builder().data("Archivos cargados").build());
    }

    private Path resolveBase(String tipo) {
        if ("sst".equalsIgnoreCase(tipo)) {
            return BASE_PATH_SST;
        }
        return BASE_PATH;
    }

    public record SoporteInfo(boolean existe, int cantidad, String ruta) {}

    public record ArchivoInfo(String nombre, long tamano, String modificado) {}

    @GetMapping("/list")
    public ApiResponse<List<ArchivoInfo>> listar(
            @RequestParam("nit") @NotBlank String nit,
            @RequestParam(value = "tipo", required = false) String tipo) throws IOException {
        String nitSafe = nit.replaceAll("[^0-9]", "");
        Path carpeta = resolveBase(tipo).resolve(nitSafe);
        if (!Files.isDirectory(carpeta)) {
            return ApiResponse.<List<ArchivoInfo>>builder().data(List.of()).build();
        }
        List<ArchivoInfo> archivos = Files.list(carpeta)
                .filter(Files::isRegularFile)
                .map(p -> {
                    try {
                        BasicFileAttributes attrs = Files.readAttributes(p, BasicFileAttributes.class);
                        return new ArchivoInfo(
                                p.getFileName().toString(),
                                attrs.size(),
                                attrs.lastModifiedTime().toString()
                        );
                    } catch (IOException e) {
                        return null;
                    }
                })
                .filter(a -> a != null)
                .collect(Collectors.toList());
        return ApiResponse.<List<ArchivoInfo>>builder().data(archivos).build();
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<String>> eliminar(
            @RequestParam("nit") @NotBlank String nit,
            @RequestParam("archivo") @NotBlank String archivo,
            @RequestParam(value = "tipo", required = false) String tipo) {
        String nitSafe = nit.replaceAll("[^0-9]", "");
        Path carpeta = resolveBase(tipo).resolve(nitSafe);
        Path destino = carpeta.resolve(archivo);
        try {
            if (Files.exists(destino)) {
                Files.delete(destino);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        ApiResponse.<String>builder()
                                .error(ApiResponse.ErrorData.builder()
                                        .code("FILE_NOT_FOUND")
                                        .message("Archivo no encontrado").build())
                                .build()
                );
            }
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    ApiResponse.<String>builder()
                            .error(ApiResponse.ErrorData.builder()
                                    .code("DELETE_ERROR")
                                    .message("No se pudo eliminar el archivo").build())
                            .build()
            );
        }
        return ResponseEntity.ok(ApiResponse.<String>builder().data("Eliminado").build());
    }
}
