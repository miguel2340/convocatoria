import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

import { ApiResponse } from '../models/prestador.model';

export interface EstadoAcceso {
  nit: string;
  modo: 'CREAR' | 'INGRESAR';
}

export interface LoginResponse {
  nit: string;
  token: string;
}

export interface PreguntaRecuperacion {
  id: string;
  texto: string;
  opciones: string[];
}

export interface RecuperacionPreguntasResponse {
  desafioId: string;
  preguntas: PreguntaRecuperacion[];
}

export interface RecuperacionValidacionResponse {
  tokenRecuperacion: string;
  representante: {
    representanteLegal: string;
    correoRepresentante: string;
    celularRepresentante: string;
    correoAdmin?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AccesoService {
  private readonly apiBase = '/api/acceso';

  constructor(private readonly http: HttpClient) {}

  obtenerEstado(nit: string) {
    const params = new HttpParams().set('nit', nit);
    return this.http
      .get<ApiResponse<EstadoAcceso>>(`${this.apiBase}/estado`, { params })
      .pipe(map((resp) => resp.data));
  }

  crearClave(nit: string, clave: string) {
    return this.http.post<void>(`${this.apiBase}/crear`, { nit, clave });
  }

  login(nit: string, clave: string) {
    return this.http.post<LoginResponse>(`${this.apiBase}/login`, { nit, clave });
  }

  obtenerPreguntasRecuperacion(nit: string) {
    const params = new HttpParams().set('nit', nit);
    return this.http.get<RecuperacionPreguntasResponse>(`${this.apiBase}/recuperacion/preguntas`, { params });
  }

  validarPreguntasRecuperacion(payload: {
    nit: string;
    desafioId: string;
    respuestas: Record<string, string>;
  }) {
    return this.http.post<RecuperacionValidacionResponse>(`${this.apiBase}/recuperacion/validar`, payload);
  }

  restablecerClaveRecuperacion(payload: { tokenRecuperacion: string; clave: string }) {
    return this.http.post<void>(`${this.apiBase}/recuperacion/restablecer`, payload);
  }
}
