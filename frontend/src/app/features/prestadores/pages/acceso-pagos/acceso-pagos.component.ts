import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AccesoService, EstadoAcceso } from '../../../../core/services/acceso.service';
import { AuthService } from '../../../../core/services/auth.service';
import { switchMap } from 'rxjs';
import { RecuperarClaveDialogComponent } from '../../components/recuperar-clave-dialog/recuperar-clave-dialog.component';

@Component({
  selector: 'app-acceso-pagos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RecuperarClaveDialogComponent],
  templateUrl: './acceso-pagos.component.html',
  styleUrl: './acceso-pagos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccesoPagosComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accesoService = inject(AccesoService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  nit = signal('');
  periodo = signal('');
  estado = signal<EstadoAcceso | null>(null);
  modoCrear = signal<boolean>(false);
  mensaje = signal<string | null>(null);
  cargando = signal<boolean>(false);
  mostrarRecuperacion = signal<boolean>(false);

  form = this.fb.group({
    clave: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(64)]],
    clave2: ['']
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const nitParam = params.get('nit') ?? '';
      const periodoParam = params.get('periodo') ?? '';
      this.nit.set(nitParam);
      this.periodo.set(periodoParam);
      if (!nitParam || !periodoParam) {
        this.estado.set(null);
        this.mensaje.set('Faltan NIT o periodo para acceder al detalle de pagos.');
        return;
      }
      this.cargarEstado(nitParam);
    });

    effect(() => {
      const crear = this.modoCrear();
      if (crear) {
        this.form.get('clave2')?.addValidators([Validators.required]);
      } else {
        this.form.get('clave2')?.clearValidators();
        this.form.get('clave2')?.setValue('', { emitEvent: false });
      }
      this.form.get('clave2')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private cargarEstado(nit: string) {
    this.cargando.set(true);
    this.accesoService.obtenerEstado(nit).subscribe({
      next: (estado) => {
        this.estado.set(estado);
        this.modoCrear.set(estado.modo === 'CREAR');
        this.mensaje.set(null);
        this.cargando.set(false);
      },
      error: () => {
        this.mensaje.set('No se pudo obtener el estado de acceso. Intenta nuevamente.');
        this.cargando.set(false);
      }
    });
  }

  enviar() {
    if (this.form.invalid || !this.estado() || !this.periodo()) {
      this.form.markAllAsTouched();
      return;
    }

    const nit = this.nit();
    const periodo = this.periodo();
    const clave = this.form.value.clave?.trim() ?? '';
    const clave2 = this.form.value.clave2?.trim() ?? '';

    if (this.modoCrear() && clave !== clave2) {
      this.mensaje.set('Las claves no coinciden.');
      return;
    }

    this.cargando.set(true);
    this.mensaje.set(null);

    const request$ = this.modoCrear()
      ? this.accesoService.crearClave(nit, clave).pipe(switchMap(() => this.accesoService.login(nit, clave)))
      : this.accesoService.login(nit, clave);

    request$.subscribe({
      next: (resp) => {
        this.cargando.set(false);
        // Guardamos el token para llamadas autenticadas (Power BI).
        this.auth.setSession(resp.nit, resp.token);
        this.router.navigate(['/pagos/detalle'], { queryParams: { nit, periodo } });
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err?.error?.message || err?.error?.error?.message || 'No se pudo completar la accion.';
        this.mensaje.set(msg);
      }
    });
  }

  abrirRecuperacion() {
    this.mostrarRecuperacion.set(true);
  }

  cerrarRecuperacion() {
    this.mostrarRecuperacion.set(false);
  }

  onClaveRestablecida(evt: { nit: string; clave: string }) {
    this.mostrarRecuperacion.set(false);
    const nit = evt.nit;
    const clave = evt.clave;
    const periodo = this.periodo();
    this.cargando.set(true);
    this.accesoService.login(nit, clave).subscribe({
      next: (resp) => {
        this.cargando.set(false);
        this.auth.setSession(resp.nit, resp.token);
        this.router.navigate(['/pagos/detalle'], { queryParams: { nit, periodo } });
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err?.error?.message || err?.error?.error?.message || 'No se pudo completar la accion.';
        this.mensaje.set(msg);
      }
    });
  }
}
