package com.fomag.convocatoria.controller;

import com.fomag.convocatoria.api.ApiResponse;
import com.fomag.convocatoria.api.dto.PagoResumenResponse;
import com.fomag.convocatoria.api.dto.PagoRadicacionPage;
import com.fomag.convocatoria.service.PagosService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.Optional;

@RestController
@RequestMapping("/api/pagos")
@Validated
public class PagosController {

    private final PagosService pagosService;

    public PagosController(PagosService pagosService) {
        this.pagosService = pagosService;
    }

    @GetMapping("/estado")
    public ResponseEntity<ApiResponse<PagoResumenResponse>> estadoPago(
            @RequestParam("nit") @NotBlank String nit,
            @RequestParam("periodo") @Pattern(regexp = "\\d{4}-\\d{2}", message = "El periodo debe tener formato YYYY-MM") String periodo
    ) {
        YearMonth yearMonth;
        try {
            yearMonth = YearMonth.parse(periodo);
        } catch (DateTimeParseException ex) {
            ApiResponse<PagoResumenResponse> error = ApiResponse.<PagoResumenResponse>builder()
                    .error(ApiResponse.ErrorData.builder()
                            .code("PERIODO_INVALIDO")
                            .message("El periodo debe tener formato YYYY-MM.")
                            .build())
                    .build();
            return ResponseEntity.badRequest().body(error);
        }
        Optional<PagoResumenResponse> pago = pagosService.consultarPorNitYPeriodo(nit.trim(), yearMonth);

        if (pago.isEmpty()) {
            ApiResponse<PagoResumenResponse> error = ApiResponse.<PagoResumenResponse>builder()
                    .error(ApiResponse.ErrorData.builder()
                            .code("PAGO_NO_ENCONTRADO")
                            .message("No se encontraron pagos para el NIT y periodo indicados.")
                            .build())
                    .build();
            return ResponseEntity.status(404).body(error);
        }

        return ResponseEntity.ok(ApiResponse.<PagoResumenResponse>builder()
                .data(pago.get())
                .build());
    }

    @GetMapping("/radicaciones")
    public ResponseEntity<ApiResponse<PagoRadicacionPage>> radicaciones(
            @RequestParam("nit") @NotBlank String nit,
            @RequestParam(value = "periodo", required = false) @Pattern(regexp = "\\d{4}-\\d{2}", message = "El periodo debe tener formato YYYY-MM") String periodo,
            @RequestParam(value = "ini", required = false) @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Fecha ini debe ser YYYY-MM-DD") String ini,
            @RequestParam(value = "fin", required = false) @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Fecha fin debe ser YYYY-MM-DD") String fin,
            @RequestParam(value = "prefijo", required = false) String prefijo,
            @RequestParam(value = "page", defaultValue = "0") int page
    ) {
        if (page < 0) page = 0;
        LocalDate fechaIni;
        LocalDate fechaFinExcl;

        try {
            if (ini != null && fin != null) {
                fechaIni = LocalDate.parse(ini);
                fechaFinExcl = LocalDate.parse(fin);
            } else if (periodo != null) {
                YearMonth ym = YearMonth.parse(periodo);
                fechaIni = ym.atDay(1);
                fechaFinExcl = ym.plusMonths(1).atDay(1);
            } else {
                ApiResponse<PagoRadicacionPage> error = ApiResponse.<PagoRadicacionPage>builder()
                        .error(ApiResponse.ErrorData.builder()
                                .code("PERIODO_REQUERIDO")
                                .message("Debes enviar periodo (YYYY-MM) o rango ini/fin (YYYY-MM-DD).")
                                .build())
                        .build();
                return ResponseEntity.badRequest().body(error);
            }
        } catch (DateTimeParseException ex) {
            ApiResponse<PagoRadicacionPage> error = ApiResponse.<PagoRadicacionPage>builder()
                    .error(ApiResponse.ErrorData.builder()
                            .code("FECHA_INVALIDA")
                            .message("Formato de fechas inválido.")
                            .build())
                    .build();
            return ResponseEntity.badRequest().body(error);
        }

        PagoRadicacionPage pageResult = pagosService.consultarRadicaciones(nit.trim(), fechaIni, fechaFinExcl, prefijo, page);

        return ResponseEntity.ok(ApiResponse.<PagoRadicacionPage>builder()
                .data(pageResult)
                .build());
    }
}
