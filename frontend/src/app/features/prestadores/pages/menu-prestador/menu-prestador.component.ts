import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PrestadoresService } from '../../../../core/services/prestadores.service';

@Component({
  selector: 'app-menu-prestador',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu-prestador.component.html',
  styleUrl: './menu-prestador.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuPrestadorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly prestadoresService = inject(PrestadoresService);

  nit = '';
  nombre = '';
  tieneSst = signal<boolean>(false);

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.nit = params.get('nit') ?? '';
      this.nombre = params.get('nombre') ?? '';
      const hintSst = params.get('sst');
      if (hintSst && hintSst.toLowerCase() === 'true') {
        this.tieneSst.set(true);
      }
      if (this.nit) {
        this.verificarSst(this.nit);
      }
    });
  }

  private verificarSst(nit: string) {
    this.tieneSst.set(false);
    this.prestadoresService.existeSst(nit).subscribe({
      next: (existe) => this.tieneSst.set(!!existe),
      error: () => this.tieneSst.set(false)
    });
  }

  irActualizarDatos() {
    if (!this.nit) return;
    this.router.navigate(['/actualizar-datos'], { queryParams: { nit: this.nit, nombre: this.nombre } });
  }

  irAgregarServicios() {
    if (!this.nit) return;
    this.router.navigate(['/registro-servicios'], { queryParams: { nit: this.nit, nombre: this.nombre } });
  }

  irArchivos() {
    if (!this.nit) return;
    this.router.navigate(['/archivos'], { queryParams: { nit: this.nit, nombre: this.nombre } });
  }

  irExcel() {
    // Ajusta al endpoint real de descarga
    window.open(`/api/reportes/excel?nit=${encodeURIComponent(this.nit)}`, '_blank');
  }

  irSubsanacion() {
    if (!this.nit) return;
    this.router.navigate(['/subsanacion'], { queryParams: { nit: this.nit, nombre: this.nombre } });
  }

  irSst() {
    if (!this.nit) return;
    if (this.tieneSst()) {
      this.router.navigate(['/menu-sst'], { queryParams: { nit: this.nit, nombre: this.nombre } });
    } else {
      this.router.navigate(['/convocatoria-salud'], { queryParams: { nit: this.nit, nombre: this.nombre, nuevo: true, sst: true } });
    }
  }
}