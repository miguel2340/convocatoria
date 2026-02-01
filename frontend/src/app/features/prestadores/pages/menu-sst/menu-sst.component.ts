import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

import { RegistroSstService, SedeSst } from '../../../../core/services/registro-sst.service';
import { SoportesService, ArchivoInfo } from '../../../../core/services/soportes.service';
import { CatalogosService } from '../../../../core/services/catalogos.service';
import { Departamento, Municipio } from '../../../../core/models/catalogos.model';

@Component({
  selector: 'app-menu-sst',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu-sst.component.html',
  styleUrl: './menu-sst.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuSstComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly registroSstService = inject(RegistroSstService);
  private readonly soportesService = inject(SoportesService);
  private readonly catalogosService = inject(CatalogosService);

  nit = '';
  nombre = '';

  sedes = signal<SedeSst[]>([]);
  archivos = signal<ArchivoInfo[]>([]);
  loadingSedes = signal(false);
  loadingArchivos = signal(false);
  error = signal<string | null>(null);
  mostrarSedes = signal(false);
  mostrarSoportes = signal(false);
  editando = signal<SedeSst | null>(null);
  serviciosSeleccionados = signal<Record<string, boolean>>({});
  departamentos = signal<Departamento[]>([]);
  municipios = signal<Municipio[]>([]);

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.nit = params.get('nit') ?? '';
      this.nombre = params.get('nombre') ?? '';
    });
  }

  toggleSedes() {
    const nuevo = !this.mostrarSedes();
    this.mostrarSedes.set(nuevo);
    if (nuevo) {
      this.cargarSedes();
      this.cargarCatalogos();
    }
  }

  cargarSedes() {
    if (!this.nit) return;
    this.loadingSedes.set(true);
    this.registroSstService.listarSedes(this.nit).subscribe({
      next: (data) => {
        this.sedes.set(data);
        this.loadingSedes.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las sedes SST.');
        this.loadingSedes.set(false);
      }
    });
  }

  cargarCatalogos() {
    this.catalogosService.obtenerDepartamentos().subscribe((deps) => this.departamentos.set(deps));
  }

  cargarMunicipios(deptoId: string) {
    if (!deptoId) {
      this.municipios.set([]);
      return;
    }
    this.catalogosService.obtenerMunicipios(deptoId).subscribe((list) => this.municipios.set(list));
  }

  listarArchivos() {
    if (!this.nit) return;
    this.loadingArchivos.set(true);
    this.soportesService.listar(this.nit, 'sst').subscribe({
      next: (data) => {
        this.archivos.set(data || []);
        this.loadingArchivos.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los soportes.');
        this.loadingArchivos.set(false);
      }
    });
  }

  toggleSoportes() {
    const nuevo = !this.mostrarSoportes();
    this.mostrarSoportes.set(nuevo);
    if (nuevo) {
      this.listarArchivos();
    }
  }

  irRegistrarSede() {
    if (!this.nit) return;
    this.router.navigate(['/registro-sst-sedes'], {
      queryParams: { nit: this.nit, nombre: this.nombre, sst: true }
    });
  }

  editarSede(_sede: SedeSst) {
    this.editando.set(_sede);
    const seleccion: Record<string, boolean> = {};
    (_sede.serviciosSst || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => !!s)
      .forEach((s) => (seleccion[s] = true));
    this.serviciosSeleccionados.set(seleccion);
    if (_sede.departamentoId) {
      this.cargarMunicipios(_sede.departamentoId);
    }
  }

  toggleServicio(nombre: string) {
    this.serviciosSeleccionados.update((curr) => ({ ...curr, [nombre]: !curr[nombre] }));
  }

  guardarEdicion() {
    const sede = this.editando();
    if (!sede || !this.nit) return;

    const servicios = Object.entries(this.serviciosSeleccionados()).filter(([, v]) => !!v).map(([k]) => k);
    if (!servicios.length) {
      this.error.set('Selecciona al menos un servicio SST.');
      return;
    }

    const payload = {
      nit: this.nit,
      direccion: sede.direccion,
      departamentoId: sede.departamentoId || undefined,
      municipioId: sede.municipioId || undefined,
      codigoPostal: sede.codigoPostal || undefined,
      servicios
    };

    this.loadingSedes.set(true);
    this.registroSstService.actualizarSede(payload).subscribe({
      next: () => {
        this.editando.set(null);
        this.serviciosSeleccionados.set({});
        this.cargarSedes();
      },
      error: () => {
        this.error.set('No se pudo actualizar la sede.');
        this.loadingSedes.set(false);
      }
    });
  }

  cancelarEdicion() {
    this.editando.set(null);
    this.serviciosSeleccionados.set({});
  }

  serviciosSst() {
    return [
      'Evaluaciones Médicas Ocupacionales',
      'Consultas de Medicina Laboral',
      'Determinación de Origen',
      'Calificación de Pérdida de Capacidad Laboral',
      'Implementación del SG-SST'
    ];
  }

  seleccionarArchivos(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length || !this.nit) return;
    this.loadingArchivos.set(true);
    this.soportesService.upload(this.nit, files, 'sst').subscribe({
      next: () => {
        this.listarArchivos();
      },
      error: () => {
        this.error.set('No se pudieron cargar los archivos.');
        this.loadingArchivos.set(false);
      }
    });
  }

  eliminarArchivo(nombre: string) {
    if (!this.nit) return;
    this.loadingArchivos.set(true);
    this.soportesService.eliminar(this.nit, nombre, 'sst').subscribe({
      next: () => this.listarArchivos(),
      error: () => {
        this.error.set('No se pudo eliminar el archivo.');
        this.loadingArchivos.set(false);
      }
    });
  }

  irMenuSalud() {
    if (!this.nit) return;
    this.router.navigate(['/gestion'], { queryParams: { nit: this.nit, nombre: this.nombre } });
  }
}
