import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { PrestadoresService } from '../../../../core/services/prestadores.service';
import { PagosService } from '../../../../core/services/pagos.service';
import { Prestador } from '../../../../core/models/prestador.model';
import { PagoEstado } from '../../../../core/models/pago-estado.model';

const NIT_PATTERN = /^\d{5,15}$/;

@Component({
  selector: 'app-buscar-prestador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './buscar-prestador.component.html',
  styleUrl: './buscar-prestador.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuscarPrestadorComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly pagosService = inject(PagosService);

  readonly esPagos = this.route.snapshot.data['tab'] === 'pagos';

  @ViewChild('pagosSection') pagosSection?: ElementRef<HTMLElement>;

  form = this.fb.group({
    nit: ['', [Validators.required, Validators.pattern(NIT_PATTERN)]],
    nombre: ['']
  });

  pagosForm = this.fb.group({
    nit: ['', [Validators.required, Validators.pattern(NIT_PATTERN)]],
    periodo: ['', [Validators.required]]
  });

  status = signal<'idle' | 'loading' | 'found' | 'not-found' | 'error'>('idle');
  message = signal('');
  successFlash = signal<string | null>(null);
  prestador = signal<Prestador | null>(null);
  existeEnRegistro = computed(() => this.prestador()?.estado === 'EXISTE_REGISTRO');

  isInvalid = computed(
    () => this.form.controls.nit.invalid && (this.form.controls.nit.touched || this.form.controls.nit.dirty)
  );

  pagoNitInvalido = computed(
    () =>
      this.pagosForm.controls.nit.invalid && (this.pagosForm.controls.nit.touched || this.pagosForm.controls.nit.dirty)
  );

  periodoInvalido = computed(
    () =>
      this.pagosForm.controls.periodo.invalid &&
      (this.pagosForm.controls.periodo.touched || this.pagosForm.controls.periodo.dirty)
  );

  pagoStatus = signal<'idle' | 'loading' | 'ok' | 'error'>('idle');
  pagoMensaje = signal('');
  pagoResultado = signal<PagoEstado | null>(null);

  constructor(private readonly prestadoresService: PrestadoresService) {
    this.route.queryParamMap.subscribe((params) => {
      const mensaje = params.get('mensaje');
      if (mensaje === 'registro-sedes-ok') {
        this.successFlash.set('Informacion de sedes guardada correctamente.');
        this.borrarMensajeLuego();
      }
      if (mensaje === 'registro-sst-ok') {
        this.successFlash.set('Informacion de sedes SST guardada correctamente.');
        this.borrarMensajeLuego();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.esPagos && this.pagosSection?.nativeElement) {
      setTimeout(() => {
        this.pagosSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }

  private borrarMensajeLuego() {
    setTimeout(() => {
      this.successFlash.set(null);
      this.router.navigate([], {
        queryParams: { mensaje: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }, 5000);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const nit = this.form.value.nit as string;

    this.status.set('loading');
    this.message.set('');

    this.prestadoresService.searchByNit(nit).subscribe({
      next: (prestador) => {
        if (prestador) {
          this.prestador.set(prestador);
          this.status.set('found');
          if (prestador.estado === 'EXISTE_REGISTRO') {
            this.message.set('El prestador ya esta registrado para gestion.');
          } else {
            this.message.set('');
          }
        } else {
          this.prestador.set(null);
          this.status.set('not-found');
          this.message.set('No encontramos el prestador en el registro.');
        }
      },
      error: () => {
        this.status.set('error');
        this.message.set('Ocurrio un error al consultar el NIT. Intenta nuevamente.');
      }
    });
  }

  irAVerificacion() {
    const nit = this.prestador()?.nit;
    if (!nit) {
      return;
    }
    // Redirige a la pantalla de acceso (creacion/ingreso de clave)
    this.router.navigate(['/acceso'], { queryParams: { nit } });
  }

  irAConvocatoriaSalud() {
    const nit = this.prestador()?.nit;
    const nombre = this.prestador()?.nombre;
    if (!nit) {
      return;
    }
    this.router.navigate(['/convocatoria-salud'], { queryParams: { nit, nombre } });
  }

  irARegistroNuevo() {
    const nit = this.form.value.nit?.toString().trim();
    if (!nit) {
      return;
    }
    const nombre = this.form.value.nombre?.toString().trim();
    if (!nombre) {
      this.message.set('Ingresa el nombre del prestador para crear registro.');
      return;
    }
    this.router.navigate(['/convocatoria-salud'], { queryParams: { nit, nuevo: true, nombre } });
  }

  irASst() {
    const nit = this.prestador()?.nit;
    const nombre = this.prestador()?.nombre;
    if (!nit) return;
    this.router.navigate(['/convocatoria-salud'], { queryParams: { nit, nombre, sst: true } });
  }

  irARegistroNuevoSst() {
    const nit = this.form.value.nit?.toString().trim();
    const nombre = this.form.value.nombre?.toString().trim();
    if (!nit || !nombre) {
      this.message.set('Ingresa NIT y nombre para crear registro SST.');
      return;
    }
    this.router.navigate(['/convocatoria-salud'], { queryParams: { nit, nuevo: true, nombre, sst: true } });
  }

  consultarPago() {
    if (this.pagosForm.invalid) {
      this.pagosForm.markAllAsTouched();
      return;
    }

    this.pagoStatus.set('loading');
    this.pagoMensaje.set('');
    this.pagoResultado.set(null);

    const nit = this.pagosForm.value.nit as string;
    const periodo = this.pagosForm.value.periodo as string;

    this.pagosService.consultarEstado(nit, periodo).subscribe({
      next: (pago) => {
        if (!pago) {
          this.pagoStatus.set('error');
          this.pagoMensaje.set('No se encontraron pagos para ese periodo.');
          return;
        }
        this.pagoResultado.set(pago);
        this.pagoStatus.set('ok');
        this.pagoMensaje.set('Consulta exitosa.');
      },
      error: () => {
        this.pagoStatus.set('error');
        this.pagoMensaje.set('Ocurrio un error al consultar los pagos. Intenta nuevamente.');
      }
    });
  }

  irADetallePagos() {
    const nit = this.pagosForm.value.nit?.toString().trim();
    const periodo = this.pagosForm.value.periodo?.toString().trim();
    if (!nit || !periodo) {
      return;
    }
    this.router.navigate(['/acceso-pagos'], { queryParams: { nit, periodo } });
  }
}
