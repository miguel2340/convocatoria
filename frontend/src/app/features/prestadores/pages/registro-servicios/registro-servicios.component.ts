import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { DireccionServicios, ServicioItem } from '../../../../core/models/servicios.model';
import { ServiciosService } from '../../../../core/services/servicios.service';
import { SoportesService } from '../../../../core/services/soportes.service';
import { PrestadorRegistroContext, SedeSeleccion } from '../../../../core/models/atencion-usuarios.model';
import { RegistroStateService } from '../../../../core/services/registro-state.service';
import { PrestadoresService } from '../../../../core/services/prestadores.service';
import { AtencionService } from '../../../../core/services/atencion.service';

@Component({
  selector: 'app-registro-servicios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registro-servicios.component.html',
  styleUrl: './registro-servicios.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroServiciosComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly serviciosService = inject(ServiciosService);
  private readonly soportesService = inject(SoportesService);
  private readonly router = inject(Router);
  private readonly registroState = inject(RegistroStateService);
  private readonly prestadoresService = inject(PrestadoresService);
  private readonly atencionService = inject(AtencionService);

  params: Record<string, string | null> = {};
  direcciones = signal<DireccionServicios[]>([]);
  seleccion = signal<Record<string, ServicioItem>>({});
  abiertas = signal<Record<string, boolean>>({});
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  uploading = signal<boolean>(false);
  soportesOk = signal<boolean>(false);
  contextoPrevio: PrestadorRegistroContext | null = null;

  constructor() {
    this.route.queryParamMap.subscribe((p) => {
      p.keys.forEach((k) => {
        this.params[k] = p.get(k);
      });
      const nit = this.params['nit'] ?? '';
      this.contextoPrevio = this.registroState.obtenerContexto();
      if (nit && this.contextoPrevio && this.contextoPrevio.nit === nit) {
        this.rellenarDesdeContexto(this.contextoPrevio);
      } else if (nit) {
        this.cargarPrestador(nit);
      }
      if (nit) {
        this.cargarServicios(nit);
      }
    });
  }

  private cargarPrestador(nit: string) {
    this.prestadoresService.searchByNit(nit).subscribe({
      next: (p) => {
        if (p) {
          this.params['nombre'] ??= p.nombre;
          this.params['clasePrestador'] ??= p.clasePrestador ?? '';
          this.params['telefonoFijo'] ??= p.telefonoFijo ?? '';
          this.params['celularAdmin'] ??= p.celularAdmin ?? '';
          this.params['correoAdmin'] ??= p.correoAdmin ?? '';
          this.params['representanteLegal'] ??= p.representanteLegal ?? '';
          this.params['correoRepresentante'] ??= p.correoRepresentante ?? '';
          this.params['celularRepresentante'] ??= p.celularRepresentante ?? '';
        }
      },
      error: (err) => console.error('No se pudo precargar prestador', err)
    });
  }

  private rellenarDesdeContexto(ctx: PrestadorRegistroContext) {
    this.params['nombre'] ??= ctx.nombre ?? null;
    this.params['clasePrestador'] ??= ctx.clasePrestador ?? null;
    this.params['telefonoFijo'] ??= ctx.telefonoFijo ?? null;
    this.params['celularAdmin'] ??= ctx.celularAdmin ?? null;
    this.params['correoAdmin'] ??= ctx.correoAdmin ?? null;
    this.params['representanteLegal'] ??= ctx.representanteLegal ?? null;
    this.params['correoRepresentante'] ??= ctx.correoRepresentante ?? null;
    this.params['celularRepresentante'] ??= ctx.celularRepresentante ?? null;
  }

  cargarServicios(nit: string) {
    this.loading.set(true);
    this.error.set(null);
    this.serviciosService.obtenerServicios(nit).subscribe({
      next: (data) => {
        this.direcciones.set(data);
        // marcar seleccionados previos
        const seleccionados: Record<string, ServicioItem> = {};
        data.forEach((dir) =>
          dir.servicios.forEach((s) => {
            if (s.yaRegistrado) {
              const key = `${s.codHabilitacion}-${s.codigo}`;
              seleccionados[key] = s;
            }
          })
        );
        this.seleccion.set(seleccionados);

        const abiertas = data.reduce((acc, dir, idx) => {
          acc[dir.codHabilitacion] = idx === 0;
          return acc;
        }, {} as Record<string, boolean>);
        this.abiertas.set(abiertas);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudo cargar las sedes y servicios.');
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  toggleSede(codHabilitacion: string) {
    const current = { ...this.abiertas() };
    current[codHabilitacion] = !current[codHabilitacion];
    this.abiertas.set(current);
  }

  toggleServicio(item: ServicioItem, checked: boolean) {
    const current = { ...this.seleccion() };
    const key = `${item.codHabilitacion}-${item.codigo}`;
    if (checked) {
      current[key] = item;
    } else {
      delete current[key];
    }
    this.seleccion.set(current);
  }

  esSeleccionado(item: ServicioItem) {
    const key = `${item.codHabilitacion}-${item.codigo}`;
    return !!this.seleccion()[key];
  }

  private agruparServiciosPorSede(servicios: ServicioItem[]): SedeSeleccion[] {
    const agrupadas: Record<string, SedeSeleccion> = {};
    servicios.forEach((servicio) => {
      if (!agrupadas[servicio.codHabilitacion]) {
        agrupadas[servicio.codHabilitacion] = {
          codHabilitacion: servicio.codHabilitacion,
          direccion: servicio.direccion,
          departamento: servicio.departamento,
          municipio: servicio.municipio,
          servicios: []
        };
      }
      agrupadas[servicio.codHabilitacion].servicios.push(servicio);
    });
    return Object.values(agrupadas);
  }

  continuar() {
    const nit = this.params['nit'] ?? '';
    if (!nit) {
      this.error.set('NIT no disponible.');
      return;
    }
    const servicios = Object.values(this.seleccion());
    if (servicios.length === 0) {
      this.error.set('Selecciona al menos un servicio.');
      return;
    }

    const requeridos = [
      'clasePrestador',
      'telefonoFijo',
      'celularAdmin',
      'correoAdmin',
      'representanteLegal',
      'correoRepresentante',
      'celularRepresentante'
    ];

    const faltantes = requeridos.filter((campo) => !this.obtenerCampo(campo));
    if (faltantes.length > 0) {
      this.error.set('Faltan datos obligatorios del paso anterior. Regresa y completa el formulario de datos del prestador.');
      return;
    }

    const contexto: PrestadorRegistroContext = {
      nit,
      nombre: this.obtenerCampo('nombre'),
      clasePrestador: this.obtenerCampo('clasePrestador'),
      telefonoFijo: this.obtenerCampo('telefonoFijo'),
      celularAdmin: this.obtenerCampo('celularAdmin'),
      correoAdmin: this.obtenerCampo('correoAdmin'),
      representanteLegal: this.obtenerCampo('representanteLegal'),
      correoRepresentante: this.obtenerCampo('correoRepresentante'),
      celularRepresentante: this.obtenerCampo('celularRepresentante')
    };

    const sedesAgrupadas = this.agruparServiciosPorSede(servicios);

    this.loading.set(true);
    this.atencionService.listarSedes(nit).subscribe({
      next: (sedesEstado) => {
        const existentes = new Set(sedesEstado.map((s) => s.codHabilitacion));
        const sedesNuevas = sedesAgrupadas.filter((s) => !existentes.has(s.codHabilitacion));

        this.registroState.setContexto(contexto);
        this.registroState.setSedes(sedesNuevas);

        const payload = {
          nit,
          nombre: contexto.nombre,
          clasePrestador: contexto.clasePrestador,
          telefonoFijo: contexto.telefonoFijo,
          celularAdmin: contexto.celularAdmin,
          correoAdmin: contexto.correoAdmin,
          representanteLegal: contexto.representanteLegal,
          correoRepresentante: contexto.correoRepresentante,
          celularRepresentante: contexto.celularRepresentante,
          servicios: servicios.map((s) => ({
            codigo: s.codigo,
            nombre: s.nombre,
            grupo: s.grupo,
            codHabilitacion: s.codHabilitacion,
            direccion: s.direccion,
            departamento: s.departamento,
            municipio: s.municipio
          }))
        };

        this.serviciosService.registrarServicios(payload).subscribe({
          next: () => {
            this.loading.set(false);
            if (sedesNuevas.length === 0) {
              this.router.navigate(['/actualizar-atencion'], { queryParams: { nit, nombre: this.params['nombre'] } });
            } else {
              this.router.navigate(['/datos-sedes'], { queryParams: { nit } });
            }
          },
          error: (err) => {
            this.loading.set(false);
            this.error.set('No se pudo registrar servicios.');
            console.error(err);
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('No se pudo verificar las sedes existentes.');
        console.error(err);
      }
    });
  }

  private obtenerCampo(key: string): string | null {
    return (this.params[key] as string | null) ?? (this.contextoPrevio as any)?.[key] ?? null;
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    const nit = this.params['nit'] ?? '';
    if (!nit || files.length === 0) {
      return;
    }
    this.uploading.set(true);
    this.soportesService.upload(nit, files).subscribe({
      next: () => {
        this.uploading.set(false);
        this.soportesOk.set(true);
        alert('Archivos cargados en la carpeta de soportes.');
      },
      error: (err) => {
        console.error(err);
        this.uploading.set(false);
        this.error.set('No se pudieron cargar los archivos.');
      }
    });
  }

  validarSoportesAntes() {
    const nit = this.params['nit'] ?? '';
    if (!nit) {
      this.error.set('NIT no disponible.');
      return;
    }
    this.loading.set(true);
    this.soportesService.check(nit).subscribe({
      next: (info) => {
        this.loading.set(false);
        if (info.existe && info.cantidad > 0) {
          this.soportesOk.set(true);
          this.continuar();
        } else {
          this.error.set('Debes adjuntar al menos un documento en la carpeta de soportes.');
        }
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.error.set('No se pudo verificar los soportes.');
      }
    });
  }
}
