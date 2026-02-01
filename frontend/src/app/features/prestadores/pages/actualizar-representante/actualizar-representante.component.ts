import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { RepresentanteService, RepresentanteDto } from '../../../../core/services/representante.service';

const CLASES = [
  'Profesional Independiente',
  'Institución Prestadores de Servicio de Salud',
  'Transporte especial de Pacientes',
  'Objeto social diferente a la Prestación de Servicios de Salud',
  'Transporte Aéreo',
  'Transporte Especial',
  'Transporte Fluvial o Marítimo',
  'Farmacia - Droguería',
  'Gestor Farmacéutico',
  'Proveedor de Dispositivos Médicos e Insumos'
];

@Component({
  selector: 'app-actualizar-representante',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './actualizar-representante.component.html',
  styleUrl: './actualizar-representante.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActualizarRepresentanteComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly representanteService = inject(RepresentanteService);

  nit = '';
  nombre = '';
  loading = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);

  form = this.fb.group({
    nombrePrestador: [{ value: '', disabled: true }],
    clasePrestador: ['', Validators.required],
    telefonoFijo: [''],
    celularAdmin: [''],
    correoAdmin: ['', Validators.email],
    // campos del representante
    primerNombre: ['', Validators.required],
    segundoNombre: [''],
    primerApellido: ['', Validators.required],
    segundoApellido: [''],
    correoRepresentante: ['', Validators.email],
    celularRepresentante: ['']
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.nit = params.get('nit') ?? '';
      this.nombre = params.get('nombre') ?? '';
      if (this.nit) {
        this.cargarDatos();
      }
    });
  }

  cargarDatos() {
    this.loading.set(true);
    this.representanteService.obtener(this.nit).subscribe({
      next: (data) => {
        if (data) {
          this.form.patchValue({
            nombrePrestador: data.nombrePrestador,
            clasePrestador: data.clasePrestador,
            telefonoFijo: data.telefonoFijo,
            celularAdmin: data.celularAdmin,
            correoAdmin: data.correoAdmin,
            correoRepresentante: data.correoRepresentante,
            celularRepresentante: data.celularRepresentante
          });
          this.nombre = data.nombrePrestador || this.nombre;
          // intentar dividir el nombre del representante legal en 4 partes
          this.rellenarNombreRep(data.representanteLegal);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los datos.');
        this.loading.set(false);
      }
    });
  }

  private rellenarNombreRep(nombre: string | null | undefined) {
    if (!nombre) return;
    const partes = nombre.trim().split(/\s+/);
    this.form.patchValue({
      primerNombre: partes[0] || '',
      segundoNombre: partes[1] || '',
      primerApellido: partes[2] || '',
      segundoApellido: partes[3] || ''
    });
  }

  private nombreRepresentanteCompleto() {
    const v = this.form.value;
    return [v.primerNombre, v.segundoNombre, v.primerApellido, v.segundoApellido].filter(Boolean).join(' ').trim();
  }

  guardar() {
    if (this.form.invalid || !this.nit) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      nit: this.nit,
      nombrePrestador: v.nombrePrestador || this.nombre,
      clasePrestador: v.clasePrestador!,
      telefonoFijo: v.telefonoFijo || '',
      celularAdmin: v.celularAdmin || '',
      correoAdmin: v.correoAdmin || '',
      representanteLegal: this.nombreRepresentanteCompleto(),
      correoRepresentante: v.correoRepresentante || '',
      celularRepresentante: v.celularRepresentante || ''
    };
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    this.representanteService.actualizar(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Datos actualizados correctamente.');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo actualizar.');
      }
    });
  }

  clases() {
    return CLASES;
  }
}
