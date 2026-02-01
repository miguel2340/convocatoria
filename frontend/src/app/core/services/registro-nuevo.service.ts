import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class RegistroNuevoService {
  private readonly apiBase = '/api/registro-nuevo';

  constructor(private readonly http: HttpClient) {}

  registrar(payload: any) {
    return this.http.post<void>(this.apiBase, payload);
  }
}
