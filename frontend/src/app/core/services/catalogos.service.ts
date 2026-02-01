import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

import { ApiResponse } from '../models/prestador.model';
import { Departamento, Municipio } from '../models/catalogos.model';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly apiBase = '/api/catalogos';

  constructor(private readonly http: HttpClient) {}

  obtenerDepartamentos() {
    return this.http
      .get<ApiResponse<Departamento[]>>(`${this.apiBase}/departamentos`)
      .pipe(map((resp) => resp.data));
  }

  obtenerMunicipios(departamentoId: string) {
    const params = new HttpParams().set('departamentoId', departamentoId);
    return this.http
      .get<ApiResponse<Municipio[]>>(`${this.apiBase}/municipios`, { params })
      .pipe(map((resp) => resp.data));
  }
}
