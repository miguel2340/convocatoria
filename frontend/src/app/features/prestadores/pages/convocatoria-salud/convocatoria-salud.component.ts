import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

const PHONE_PATTERN = /^[0-9]{7,10}$/;

function emailMatchValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.get('correo')?.value;
  const confirm = control.get('confirm')?.value;
  return email && confirm && email !== confirm ? { emailMismatch: true } : null;
}

function emailMatchValidatorRep(control: AbstractControl): ValidationErrors | null {
  const email = control.get('correo')?.value;
  const confirm = control.get('correoConfirm')?.value;
  return email && confirm && email !== confirm ? { emailMismatch: true } : null;
}

@Component({
  selector: 'app-convocatoria-salud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './convocatoria-salud.component.html',
  styleUrl: './convocatoria-salud.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConvocatoriaSaludComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  nit = '';
  nombre = '';
  mostrarCategorias = false;
  isSst = false;

  form = this.fb.group({
    clasePrestador: ['', Validators.required],
    telefonoFijo: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    celularAdmin: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    adminEmails: this.fb.group(
      {
        correo: ['', [Validators.required, Validators.email]],
        confirm: ['', [Validators.required, Validators.email]]
      },
      { validators: emailMatchValidator }
    ),
    representante: this.fb.group({
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      correo: ['', [Validators.required, Validators.email]],
      correoConfirm: ['', [Validators.required, Validators.email]],
      celular: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]]
    }, { validators: emailMatchValidatorRep }),
    categorias: this.fb.group({
      transporte: [false],
      insumos: [false],
      medicamentos: [false]
    })
  });

  clases = [
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

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.nit = params.get('nit') ?? '';
      this.nombre = params.get('nombre') ?? '';
      this.isSst = (params.get('sst') ?? '').toLowerCase() === 'true';
      const esNuevo = (params.get('nuevo') ?? '').toLowerCase() === 'true';
      this.mostrarCategorias = esNuevo && !this.isSst;

      if (this.isSst) {
        const control = this.form.get('clasePrestador');
        control?.setValue('SST', { emitEvent: false });
        control?.clearValidators();
        control?.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      nit: this.nit,
      nombre: this.nombre,
      clasePrestador: this.isSst ? 'SST' : this.form.value.clasePrestador,
      telefonoFijo: this.form.value.telefonoFijo,
      celularAdmin: this.form.value.celularAdmin,
      correoAdmin: this.form.value.adminEmails?.correo,
      representanteLegal: [
        this.form.value.representante?.primerNombre,
        this.form.value.representante?.segundoNombre,
        this.form.value.representante?.primerApellido,
        this.form.value.representante?.segundoApellido
      ].filter(Boolean).join(' ').trim(),
      correoRepresentante: this.form.value.representante?.correo,
      celularRepresentante: this.form.value.representante?.celular,
      categorias: this.mostrarCategorias ? this.form.value.categorias : undefined
    };

    const categorias = this.mostrarCategorias ? this.form.value.categorias : undefined;

    if (this.isSst) {
      this.router.navigate(['/registro-sst-sedes'], {
        queryParams: payload
      });
      return;
    }

    if (this.mostrarCategorias) {
      this.router.navigate(['/registro-sedes-nuevo'], {
        queryParams: {
          ...payload,
          transporte: categorias?.transporte ?? false,
          insumos: categorias?.insumos ?? false,
          medicamentos: categorias?.medicamentos ?? false
        }
      });
    } else {
      this.router.navigate(['/registro-servicios'], {
        queryParams: payload
      });
    }
  }
}
