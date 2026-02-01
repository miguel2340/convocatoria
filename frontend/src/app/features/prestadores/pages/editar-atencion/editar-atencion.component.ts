import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AtencionService, AtencionSede } from '../../../../core/services/atencion.service';

@Component({
  selector: 'app-editar-atencion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './editar-atencion.component.html',
  styleUrl: './editar-atencion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditarAtencionComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly atencionService = inject(AtencionService);

  nit = '';
  nombre = '';
  cod = '';
  loading = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);

  form = this.fb.group({
    direccion: [''],
    departamento: [''],
    municipio: [''],
    mecanismoCitas: [''],
    correoAutorizado: [''],
    telefonoFijo: [''],
    celular: [''],
    horarioDesde: [''],
    horarioHasta: [''],
    whatsapp: [''],
    horarioWhatsappDesde: [''],
    horarioWhatsappHasta: [''],
    lineaTelefonica: [''],
    horarioTelefonoDesde: [''],
    horarioTelefonoHasta: [''],
    paginaWeb: [''],
    correoNoPresencial: [''],
    nombreCoordinador: [''],
    telefonoCoordinador: [''],
    correoCoordinador: [''],
    nombreGerente: [''],
    correoGerente: [''],
    celularGerente: [''],
    correoAdministrativo: [''],
    telefonoAdministrativo: [''],
    celularAdministrativo: [''],
    ambulatorio: [false],
    hospitalario: [false],
    domiciliario: [false],
    transporte: [false],
    insumos: [false],
    servicioExclusivo: [false],
    servicioAgenda: [false],
    servicioFranjas: [false]
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.nit = params.get('nit') ?? '';
      this.nombre = params.get('nombre') ?? '';
      this.cod = params.get('cod') ?? '';
      if (this.nit && this.cod) {
        this.cargar();
      }
    });
  }

  cargar() {
    this.loading.set(true);
    this.atencionService.obtenerSede(this.nit, this.cod).subscribe({
      next: (data) => {
        if (data) {
          this.form.patchValue(data as any);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los datos.');
        this.loading.set(false);
      }
    });
  }

  guardar() {
    if (!this.nit || !this.cod) return;
    const payload: Partial<AtencionSede> & { nit: string; codHabilitacion: string } = {
      nit: this.nit,
      codHabilitacion: this.cod,
      ...(this.form.value as any)
    };
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    this.atencionService.guardar(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Atención usuario guardada.');
        setTimeout(() => {
          this.router.navigate(['/actualizar-atencion'], { queryParams: { nit: this.nit, nombre: this.nombre } });
        }, 800);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo guardar.');
      }
    });
  }
}
