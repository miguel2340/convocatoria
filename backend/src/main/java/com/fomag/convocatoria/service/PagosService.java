package com.fomag.convocatoria.service;

import com.fomag.convocatoria.api.dto.PagoResumenResponse;
import com.fomag.convocatoria.api.dto.PagoRadicacionItem;
import com.fomag.convocatoria.api.dto.PagoRadicacionPage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PagosService {

    @Qualifier("pagosJdbcTemplate")
    private final JdbcTemplate pagosJdbcTemplate;

    @Transactional(readOnly = true, transactionManager = "pagosTransactionManager")
    public Optional<PagoResumenResponse> consultarPorNitYPeriodo(String nit, YearMonth periodo) {
        String sql = """
            SELECT
                nit,
                MIN(LTRIM(RTRIM(nom_prestador))) AS nom_prestador,
                SUM(ISNULL(valor_pagado, 0)) AS total_valor_pagado
            FROM [fomagf].[dbo].[radicacion_filtrada]
            WHERE
                LTRIM(RTRIM(nit)) = LTRIM(RTRIM(?))
                AND YEAR(fecha_radicacion) = ?
                AND MONTH(fecha_radicacion) = ?
            GROUP BY nit
            """;

        return pagosJdbcTemplate.query(sql, ps -> {
            ps.setString(1, nit);
            ps.setInt(2, periodo.getYear());
            ps.setInt(3, periodo.getMonthValue());
        }, rs -> {
            if (rs.next()) {
                BigDecimal total = rs.getBigDecimal("total_valor_pagado");
                return Optional.of(PagoResumenResponse.builder()
                        .nit(rs.getString("nit"))
                        .nomPrestador(rs.getString("nom_prestador"))
                        .anio(periodo.getYear())
                        .mes(periodo.getMonthValue())
                        .totalValorPagado(total)
                        .build());
            }
            return Optional.empty();
        });
    }

    @Transactional(readOnly = true, transactionManager = "pagosTransactionManager")
    public PagoRadicacionPage consultarRadicaciones(String nit,
                                                    LocalDate fechaInicio,
                                                    LocalDate fechaFinExclusiva,
                                                    String prefijo,
                                                    int page) {
        int size = 1000;
        int limit = size + 1; // para detectar si hay siguiente página
        // Totales
        StringBuilder sqlTotales = new StringBuilder("""
            SELECT
                COUNT(DISTINCT rf.prefijo_factura) AS total_rows,
                SUM(ISNULL(rf.valor_factura, 0)) AS total_facturado,
                SUM(ISNULL(rf.valor_pagado, 0)) AS total_pagado
            FROM [fomagf].[dbo].[radicacion_filtrada] rf
            WHERE
                LTRIM(RTRIM(rf.nit)) = LTRIM(RTRIM(?))
                AND rf.fecha_radicacion >= ?
                AND rf.fecha_radicacion <  ?
            """);

        List<Object> paramsTot = new ArrayList<>();
        paramsTot.add(nit);
        paramsTot.add(Date.valueOf(fechaInicio));
        paramsTot.add(Date.valueOf(fechaFinExclusiva));

        if (prefijo != null && !prefijo.isBlank()) {
            sqlTotales.append(" AND rf.prefijo_factura LIKE ? ");
            paramsTot.add(prefijo.trim() + "%");
        }

        var totales = pagosJdbcTemplate.queryForObject(sqlTotales.toString(), paramsTot.toArray(), (rs, rowNum) -> {
            var fact = rs.getBigDecimal("total_facturado");
            var pag = rs.getBigDecimal("total_pagado");
            java.math.BigDecimal pendiente = fact != null && pag != null ? fact.subtract(pag) : java.math.BigDecimal.ZERO;
            if (pendiente.compareTo(java.math.BigDecimal.ZERO) < 0) pendiente = java.math.BigDecimal.ZERO;
            return new Object[] {
                rs.getLong("total_rows"),
                fact == null ? java.math.BigDecimal.ZERO : fact,
                pag == null ? java.math.BigDecimal.ZERO : pag,
                pendiente
            };
        });

        StringBuilder sql = new StringBuilder("""
            SELECT
                rf.nit,
                rf.prefijo_factura,
                MIN(rf.fecha_radicacion) AS fecha_radicacion,
                SUM(ISNULL(rf.valor_factura, 0)) AS valor_facturado,
                SUM(ISNULL(rf.valor_pagado, 0)) AS valor_pagado,
                MAX(rf.feccha_pago) AS feccha_pago
            FROM [fomagf].[dbo].[radicacion_filtrada] rf
            WHERE
                LTRIM(RTRIM(rf.nit)) = LTRIM(RTRIM(?))
                AND rf.fecha_radicacion >= ?
                AND rf.fecha_radicacion <  ?
            """);

        List<Object> params = new ArrayList<>();
        params.add(nit);
        params.add(Date.valueOf(fechaInicio));
        params.add(Date.valueOf(fechaFinExclusiva));

        if (prefijo != null && !prefijo.isBlank()) {
            sql.append(" AND rf.prefijo_factura LIKE ? ");
            params.add(prefijo.trim() + "%");
        }

        sql.append("""
            GROUP BY
                rf.nit,
                rf.prefijo_factura
            ORDER BY
                MIN(rf.fecha_radicacion) DESC,
                rf.prefijo_factura
            OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            """);
        params.add(page * size);
        params.add(limit);

        List<PagoRadicacionItem> items = pagosJdbcTemplate.query(sql.toString(), params.toArray(), (rs, rowNum) ->
                PagoRadicacionItem.builder()
                        .nit(rs.getString("nit"))
                        .prefijoFactura(rs.getString("prefijo_factura"))
                        .fechaRadicacion(rs.getDate("fecha_radicacion").toLocalDate())
                        .valorFacturado(rs.getBigDecimal("valor_facturado"))
                        .valorPagado(rs.getBigDecimal("valor_pagado"))
                        .fechaPago(rs.getDate("feccha_pago") != null ? rs.getDate("feccha_pago").toLocalDate() : null)
                        .build()
        );

        boolean hasNext = items.size() > size;
        if (hasNext) {
            items = items.subList(0, size);
        }

        return PagoRadicacionPage.builder()
                .nit(nit)
                .fechaInicio(fechaInicio)
                .fechaFin(fechaFinExclusiva)
                .prefijo(prefijo)
                .page(page)
                .size(size)
                .hasNext(hasNext)
                .totalRows(totales != null ? (Long) totales[0] : 0L)
                .totalFacturado(totales != null ? (java.math.BigDecimal) totales[1] : java.math.BigDecimal.ZERO)
                .totalPagado(totales != null ? (java.math.BigDecimal) totales[2] : java.math.BigDecimal.ZERO)
                .totalPendiente(totales != null ? (java.math.BigDecimal) totales[3] : java.math.BigDecimal.ZERO)
                .items(items)
                .build();
    }
}
