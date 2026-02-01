import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, of, throwError } from 'rxjs';

import { ApiResponse } from '../models/prestador.model';
import { PagoEstado } from '../models/pago-estado.model';
import { PagoRadicacionPage } from '../models/pago-radicacion.model';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly apiBase = '/api';

  constructor(private readonly http: HttpClient) {}

  consultarEstado(nit: string, periodo: string) {
    const params = new HttpParams().set('nit', nit).set('periodo', periodo);
    return this.http.get<ApiResponse<PagoEstado>>(`${this.apiBase}/pagos/estado`, { params }).pipe(
      map((resp) => resp.data),
      catchError((err) => {
        if (err.status === 404) {
          return of(null);
        }
        return throwError(() => err);
      })
    );
  }

  consultarRadicaciones(nit: string, filtros: { periodo?: string; ini?: string; fin?: string; prefijo?: string; page?: number }) {
    let params = new HttpParams().set('nit', nit);
    if (filtros.periodo) {
      params = params.set('periodo', filtros.periodo);
    }
    if (filtros.ini) {
      params = params.set('ini', filtros.ini);
    }
    if (filtros.fin) {
      params = params.set('fin', filtros.fin);
    }
    if (filtros.prefijo) {
      params = params.set('prefijo', filtros.prefijo);
    }
    if (filtros.page !== undefined) {
      params = params.set('page', filtros.page);
    }
    return this.http.get<ApiResponse<PagoRadicacionPage>>(`${this.apiBase}/pagos/radicaciones`, { params }).pipe(
      map((resp) => resp.data),
      catchError((err) => {
        if (err.status === 404) {
          return of(null);
        }
        return throwError(() => err);
      })
    );
  }
}
