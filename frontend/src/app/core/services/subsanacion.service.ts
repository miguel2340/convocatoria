import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

export interface SubsanacionItem {
  tipoCalificacion: string;
  numero: string;
  documentoRevisar: string;
  descripcion: string;
  resultado: string;
  fechaEvaluacion: string;
  observacion: string;
}

export interface SubsanacionEvaluacion {
  etapa: string;
  items: SubsanacionItem[];
}

export interface SubsanacionArchivo {
  nombre: string;
  tamano: number;
  modificado: string;
}

@Injectable({ providedIn: 'root' })
export class SubsanacionService {
  private readonly apiBase = '/api/subsanacion';

  constructor(private readonly http: HttpClient) {}

  obtenerEvaluacion(nit: string) {
    const params = new HttpParams().set('nit', nit);
    return this.http
      .get<{ data: SubsanacionEvaluacion }>(`${this.apiBase}/evaluacion`, { params })
      .pipe(map((r) => r.data));
  }

  listarSoportes(nit: string) {
    const params = new HttpParams().set('nit', nit);
    return this.http
      .get<{ data: SubsanacionArchivo[] }>(`${this.apiBase}/soportes`, { params })
      .pipe(map((r) => r.data || []));
  }

  subirSoportes(nit: string, files: File[]) {
    const form = new FormData();
    form.append('nit', nit);
    files.forEach((f) => form.append('files', f));
    return this.http.post<void>(`${this.apiBase}/soportes`, form);
  }

  eliminarSoporte(nit: string, archivo: string) {
    const params = new HttpParams().set('nit', nit).set('archivo', archivo);
    return this.http.delete<void>(`${this.apiBase}/soportes`, { params });
  }
}
