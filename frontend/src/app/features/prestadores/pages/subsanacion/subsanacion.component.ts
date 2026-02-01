import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SubsanacionService, SubsanacionArchivo, SubsanacionItem } from '../../../../core/services/subsanacion.service';

@Component({
  selector: 'app-subsanacion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './subsanacion.component.html',
  styleUrl: './subsanacion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubsanacionComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly subsanacionService = inject(SubsanacionService);

  nit = '';
  nombre = '';
  etapa = '';

  loadingEval = signal(false);
  loadingFiles = signal(false);
  uploading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  items = signal<SubsanacionItem[]>([]);
  archivos = signal<SubsanacionArchivo[]>([]);

  constructor() {
    this.route.queryParamMap.subscribe((p) => {
      this.nit = p.get('nit') ?? '';
      this.nombre = p.get('nombre') ?? '';
      if (this.nit) {
        this.cargarEvaluacion();
        this.cargarArchivos();
      } else {
        this.error.set('No se encontró el NIT. Regresa al menú.');
      }
    });
  }

  cargarEvaluacion() {
    this.loadingEval.set(true);
    this.subsanacionService.obtenerEvaluacion(this.nit).subscribe({
      next: (data) => {
        this.etapa = data.etapa;
        this.items.set(data.items || []);
        this.loadingEval.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loadingEval.set(false);
        this.error.set('No se pudo cargar la evaluación.');
      }
    });
  }

  cargarArchivos() {
    this.loadingFiles.set(true);
    this.subsanacionService.listarSoportes(this.nit).subscribe({
      next: (data) => {
        this.archivos.set(data);
        this.loadingFiles.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loadingFiles.set(false);
        this.error.set('No se pudieron cargar los soportes.');
      }
    });
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;
    this.uploading.set(true);
    this.success.set(null);
    this.error.set(null);
    this.subsanacionService.subirSoportes(this.nit, files).subscribe({
      next: () => {
        this.uploading.set(false);
        this.success.set('Archivos cargados correctamente.');
        input.value = '';
        this.cargarArchivos();
      },
      error: (err) => {
        console.error(err);
        this.uploading.set(false);
        this.error.set('No se pudieron subir los archivos.');
      }
    });
  }

  eliminar(nombre: string) {
    if (!confirm(`¿Eliminar ${nombre}?`)) return;
    this.loadingFiles.set(true);
    this.subsanacionService.eliminarSoporte(this.nit, nombre).subscribe({
      next: () => {
        this.loadingFiles.set(false);
        this.archivos.set(this.archivos().filter((a) => a.nombre !== nombre));
      },
      error: (err) => {
        console.error(err);
        this.loadingFiles.set(false);
        this.error.set('No se pudo eliminar el archivo.');
      }
    });
  }

  volverMenu() {
    this.router.navigate(['/gestion'], { queryParams: { nit: this.nit, nombre: this.nombre } });
  }
}
