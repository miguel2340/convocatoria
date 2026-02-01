import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { RegistroAtencionRequest } from '../models/atencion-usuarios.model';

@Injectable({ providedIn: 'root' })
export class AtencionUsuariosService {
  private readonly apiBase = '/api/atencion-usuarios';

  constructor(private readonly http: HttpClient) {}

  registrar(payload: RegistroAtencionRequest) {
    return this.http.post<void>(this.apiBase, payload);
  }
}
