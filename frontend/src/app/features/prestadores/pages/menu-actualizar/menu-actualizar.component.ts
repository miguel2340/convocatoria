import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu-actualizar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu-actualizar.component.html',
  styleUrl: './menu-actualizar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuActualizarComponent {
  private readonly route = inject(ActivatedRoute);

  nit = '';
  nombre = '';

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.nit = params.get('nit') ?? '';
      this.nombre = params.get('nombre') ?? '';
    });
  }

  irRepresentante() {
    if (!this.nit) return;
    window.open(`/actualizar-representante?nit=${encodeURIComponent(this.nit)}&nombre=${encodeURIComponent(this.nombre)}`, '_self');
  }

  irAtencion() {
    if (!this.nit) return;
    window.open(`/actualizar-atencion?nit=${encodeURIComponent(this.nit)}&nombre=${encodeURIComponent(this.nombre)}`, '_self');
  }
}
