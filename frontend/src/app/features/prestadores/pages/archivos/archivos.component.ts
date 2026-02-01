import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SoportesService, ArchivoInfo } from '../../../../core/services/soportes.service';

@Component({
  selector: 'app-archivos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './archivos.component.html',
  styleUrl: './archivos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchivosComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly soportesService = inject(SoportesService);

  nit = '';
  nombre = '';
  loading = signal(false);
  uploading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  archivos = signal<ArchivoInfo[]>([]);

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.nit = params.get('nit') ?? '';
      this.nombre = params.get('nombre') ?? '';
      if (this.nit) {
        this.cargar();
      } else {
        this.error.set('No se encontró el NIT. Regresa al menú.');
      }
    });
  }

  cargar() {
    if (!this.nit) return;
    this.loading.set(true);
    this.error.set(null);
    this.soportesService.listar(this.nit).subscribe({
      next: (data) => {
        this.archivos.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.error.set('No se pudieron cargar los soportes.');
      }
    });
  }

  subir(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!this.nit || files.length === 0) return;
    this.uploading.set(true);
    this.success.set(null);
    this.error.set(null);
    this.soportesService.upload(this.nit, files).subscribe({
      next: () => {
        this.uploading.set(false);
        this.success.set('Archivo(s) cargado(s) correctamente.');
        this.cargar();
        input.value = '';
      },
      error: (err) => {
        console.error(err);
        this.uploading.set(false);
        this.error.set('No se pudieron subir los archivos.');
      }
    });
  }

  eliminar(archivo: string) {
    if (!confirm(`¿Eliminar ${archivo}?`)) return;
    this.loading.set(true);
    this.soportesService.eliminar(this.nit, archivo).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Archivo eliminado.');
        this.archivos.set(this.archivos().filter((a) => a.nombre !== archivo));
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.error.set('No se pudo eliminar el archivo.');
      }
    });
  }

  volverMenu() {
    this.router.navigate(['/gestion'], { queryParams: { nit: this.nit, nombre: this.nombre } });
  }
}
