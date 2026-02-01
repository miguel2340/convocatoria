import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

import { ApiResponse } from '../models/prestador.model';
import { PowerBIEmbedConfig } from '../models/powerbi.model';

@Injectable({ providedIn: 'root' })
export class PowerBIService {
  private readonly apiBase = '/api/pbi';

  constructor(private readonly http: HttpClient) {}

  obtenerEmbedConfig() {
    // El backend devuelve el objeto plano (no envuelto en ApiResponse).
    return this.http
      .get<PowerBIEmbedConfig | ApiResponse<PowerBIEmbedConfig>>(`${this.apiBase}/embed-config`)
      .pipe(map((resp) => (resp as ApiResponse<PowerBIEmbedConfig>).data ?? (resp as PowerBIEmbedConfig)));
  }
}
