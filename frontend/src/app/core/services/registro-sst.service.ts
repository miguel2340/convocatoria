import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RegistroSstService {
  private readonly apiBase = '/api/registro-sst';

  constructor(private readonly http: HttpClient) {}

  registrar(payload: any) {
    return this.http.post<void>(this.apiBase, payload);
  }

  listarSedes(nit: string) {
    const params = new HttpParams().set('nit', nit);
    return this.http
      .get<{ data: SedeSst[] }>(`${this.apiBase}/sedes`, { params })
      .pipe(map((resp) => resp.data || []));
  }

  actualizarSede(payload: { nit: string; direccion: string; servicios: string[]; departamentoId?: string; municipioId?: string; codigoPostal?: string }) {
    return this.http.put<void>(`${this.apiBase}/sede`, payload);
  }
}

export interface SedeSst {
  direccion: string;
  departamentoId: string;
  municipioId: string;
  codigoPostal: string;
  fechaRegistro: string | null;
  serviciosSst?: string | null;
}
