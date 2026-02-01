package com.fomag.convocatoria.service;

import com.fomag.convocatoria.api.dto.DepartamentoDto;
import com.fomag.convocatoria.api.dto.MunicipioDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogosService {

    private final JdbcTemplate jdbcTemplate;

    public List<DepartamentoDto> obtenerDepartamentos() {
        String sql = "SELECT id_departamento, departamento FROM departamentos ORDER BY departamento";
        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new DepartamentoDto(rs.getString("id_departamento"), rs.getString("departamento"))
        );
    }

    public List<MunicipioDto> obtenerMunicipiosPorDepartamento(String departamentoId) {
        String sql = "SELECT id_municipio, municipio FROM municipios WHERE departamento_id = ? ORDER BY municipio";
        return jdbcTemplate.query(sql, ps -> ps.setString(1, departamentoId), (rs, rowNum) ->
                new MunicipioDto(rs.getString("id_municipio"), rs.getString("municipio"))
        );
    }
}
