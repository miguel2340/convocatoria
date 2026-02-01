import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

import { ApiResponse } from '../models/prestador.model';
import { DireccionServicios } from '../models/servicios.model';

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  private readonly apiBase = '/api/servicios';

  constructor(private readonly http: HttpClient) {}

  obtenerServicios(nit: string) {
    const params = new HttpParams().set('nit', nit);
    return this.http
      .get<ApiResponse<DireccionServicios[]>>(this.apiBase, { params })
      .pipe(map((resp) => resp.data));
  }

  registrarServicios(payload: any) {
    return this.http.post<void>(`${this.apiBase}/registro`, payload);
  }
}
