import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, of, throwError } from 'rxjs';

import { ApiResponse, Prestador } from '../models/prestador.model';

@Injectable({ providedIn: 'root' })
export class PrestadoresService {
  private readonly apiBase = '/api';

  constructor(private readonly http: HttpClient) {}

  searchByNit(nit: string) {
    const params = new HttpParams().set('nit', nit);
    return this.http
      .get<ApiResponse<Prestador>>(`${this.apiBase}/prestadores`, { params })
      .pipe(
        map((resp) => resp.data),
        catchError((err) => {
          if (err.status === 404) {
            return of(null);
          }
          return throwError(() => err);
        })
      );
  }

  existeSst(nit: string) {
    const params = new HttpParams().set('nit', nit);
    return this.http
      .get<ApiResponse<boolean>>(`${this.apiBase}/prestadores/sst/existe`, { params })
      .pipe(map((resp) => resp.data));
  }
}
