import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AtencionService, SedeEstado } from '../../../../core/services/atencion.service';

@Component({
  selector: 'app-actualizar-atencion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './actualizar-atencion.component.html',
  styleUrl: './actualizar-atencion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActualizarAtencionComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly atencionService = inject(AtencionService);

  nit = '';
  nombre = '';
  sedes = signal<SedeEstado[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.nit = params.get('nit') ?? '';
      this.nombre = params.get('nombre') ?? '';
      if (this.nit) {
        this.cargar();
      }
    });
  }

  cargar() {
    this.loading.set(true);
    this.atencionService.listarSedes(this.nit).subscribe({
      next: (data) => {
        this.sedes.set(data);
        this.loading.set(false);
        if (data.length === 1) {
          this.irEditar(data[0]);
        }
      },
      error: () => {
        this.error.set('No se pudieron cargar las sedes.');
        this.loading.set(false);
      }
    });
  }

  irEditar(sede: SedeEstado) {
    this.router.navigate(['/editar-atencion'], {
      queryParams: { nit: this.nit, nombre: this.nombre, cod: sede.codHabilitacion }
    });
  }

  badge(estado: string) {
    if (estado === 'SEDE_NUEVA') return { clase: 'b-new', texto: 'Sede nueva' };
    if (estado === 'SIN_DILIGENCIAR') return { clase: 'b-pend', texto: 'Pendiente' };
    return { clase: 'b-ok', texto: 'Completa' };
  }
}
