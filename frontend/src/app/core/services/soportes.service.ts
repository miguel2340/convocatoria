import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

import { ApiResponse } from '../models/prestador.model';

export interface SoporteInfo {
  existe: boolean;
  cantidad: number;
  ruta: string;
}

export interface ArchivoInfo {
  nombre: string;
  tamano: number;
  modificado: string;
}

@Injectable({ providedIn: 'root' })
export class SoportesService {
  private readonly apiBase = '/api/soportes';

  constructor(private readonly http: HttpClient) {}

  check(nit: string, tipo: 'salud' | 'sst' = 'salud') {
    let params = new HttpParams().set('nit', nit);
    if (tipo === 'sst') {
      params = params.set('tipo', 'sst');
    }
    return this.http
      .get<ApiResponse<SoporteInfo>>(`${this.apiBase}/check`, { params })
      .pipe(map((resp) => resp.data));
  }

  upload(nit: string, files: File[], tipo: 'salud' | 'sst' = 'salud') {
    const formData = new FormData();
    formData.append('nit', nit);
    if (tipo === 'sst') {
      formData.append('tipo', 'sst');
    }
    files.forEach((f) => formData.append('files', f));
    return this.http.post<ApiResponse<string>>(`${this.apiBase}/upload`, formData);
  }

  listar(nit: string, tipo: 'salud' | 'sst' = 'salud') {
    let params = new HttpParams().set('nit', nit);
    if (tipo === 'sst') {
      params = params.set('tipo', 'sst');
    }
    return this.http.get<ApiResponse<ArchivoInfo[]>>(`${this.apiBase}/list`, { params }).pipe(map((r) => r.data));
  }

  eliminar(nit: string, archivo: string, tipo: 'salud' | 'sst' = 'salud') {
    let params = new HttpParams().set('nit', nit).set('archivo', archivo);
    if (tipo === 'sst') {
      params = params.set('tipo', 'sst');
    }
    return this.http.delete<ApiResponse<string>>(`${this.apiBase}`, { params });
  }
}
