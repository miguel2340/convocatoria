import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

export interface RepresentanteDto {
  nombrePrestador: string;
  clasePrestador: string;
  telefonoFijo: string;
  celularAdmin: string;
  correoAdmin: string;
  representanteLegal: string;
  correoRepresentante: string;
  celularRepresentante: string;
}

export interface RepresentanteBasico {
  representanteLegal: string;
  correoRepresentante: string;
  celularRepresentante: string;
  correoAdmin?: string;
}

@Injectable({ providedIn: 'root' })
export class RepresentanteService {
  private readonly apiBase = '/api/representante';

  constructor(private readonly http: HttpClient) {}

  obtener(nit: string) {
    const params = new HttpParams().set('nit', nit);
    return this.http.get<{ data: RepresentanteDto | null }>(this.apiBase, { params }).pipe(map((resp) => resp.data));
  }

  actualizar(payload: {
    nit: string;
    nombrePrestador: string;
    clasePrestador: string;
    telefonoFijo?: string;
    celularAdmin?: string;
    correoAdmin?: string;
    representanteLegal: string;
    correoRepresentante?: string;
    celularRepresentante?: string;
  }) {
    return this.http.put<void>(this.apiBase, payload);
  }

  actualizarDesdeRecuperacion(payload: { tokenRecuperacion: string } & RepresentanteBasico) {
    return this.http.put<void>(`${this.apiBase}/recuperacion`, payload);
  }
}
