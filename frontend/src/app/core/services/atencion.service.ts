import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

export interface SedeEstado {
  codHabilitacion: string;
  direccion: string;
  departamento: string;
  municipio: string;
  estado: 'SEDE_NUEVA' | 'SIN_DILIGENCIAR' | 'COMPLETA';
}

export interface AtencionSede {
  codHabilitacion: string;
  direccion: string;
  departamento: string;
  municipio: string;
  mecanismoCitas: string;
  correoAutorizado: string;
  telefonoFijo: string;
  celular: string;
  horarioDesde: string;
  horarioHasta: string;
  whatsapp: string;
  horarioWhatsappDesde: string;
  horarioWhatsappHasta: string;
  lineaTelefonica: string;
  horarioTelefonoDesde: string;
  horarioTelefonoHasta: string;
  paginaWeb: string;
  correoNoPresencial: string;
  nombreCoordinador: string;
  telefonoCoordinador: string;
  correoCoordinador: string;
  nombreGerente: string;
  correoGerente: string;
  celularGerente: string;
  correoAdministrativo: string;
  telefonoAdministrativo: string;
  celularAdministrativo: string;
  ambulatorio: boolean;
  hospitalario: boolean;
  domiciliario: boolean;
  transporte: boolean;
  insumos: boolean;
  servicioExclusivo: boolean;
  servicioAgenda: boolean;
  servicioFranjas: boolean;
}

@Injectable({ providedIn: 'root' })
export class AtencionService {
  private readonly apiBase = '/api/atencion';

  constructor(private readonly http: HttpClient) {}

  listarSedes(nit: string) {
    const params = new HttpParams().set('nit', nit);
    return this.http.get<{ data: SedeEstado[] }>(`${this.apiBase}/sedes`, { params }).pipe(map((r) => r.data || []));
  }

  obtenerSede(nit: string, cod: string) {
    const params = new HttpParams().set('nit', nit).set('cod', cod);
    return this.http.get<{ data: AtencionSede | null }>(`${this.apiBase}/sede`, { params }).pipe(map((r) => r.data));
  }

  guardar(payload: Partial<AtencionSede> & { nit: string; codHabilitacion: string }) {
    return this.http.put<void>(`${this.apiBase}/sede`, payload);
  }
}
