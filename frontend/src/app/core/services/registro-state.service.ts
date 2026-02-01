import { Injectable, signal } from '@angular/core';

import { PrestadorRegistroContext, SedeSeleccion } from '../models/atencion-usuarios.model';

@Injectable({ providedIn: 'root' })
export class RegistroStateService {
  private readonly contexto = signal<PrestadorRegistroContext | null>(null);
  private readonly sedesSeleccionadas = signal<SedeSeleccion[]>([]);

  setContexto(contexto: PrestadorRegistroContext) {
    this.contexto.set(contexto);
  }

  setSedes(sedes: SedeSeleccion[]) {
    this.sedesSeleccionadas.set(sedes);
  }

  obtenerContexto() {
    return this.contexto();
  }

  obtenerSedes() {
    return this.sedesSeleccionadas();
  }

  limpiar() {
    this.contexto.set(null);
    this.sedesSeleccionadas.set([]);
  }
}
