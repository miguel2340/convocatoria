import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap } from 'rxjs';

import { AccesoService, EstadoAcceso } from '../../../../core/services/acceso.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RecuperarClaveDialogComponent } from '../../components/recuperar-clave-dialog/recuperar-clave-dialog.component';

@Component({
  selector: 'app-acceso-prestador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RecuperarClaveDialogComponent],
  templateUrl: './acceso-prestador.component.html',
  styleUrl: './acceso-prestador.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccesoPrestadorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accesoService = inject(AccesoService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  nit = signal('');
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
    effect(() => {
      const nitParam = this.route.snapshot.queryParamMap.get('nit') ?? '';
      this.nit.set(nitParam);
      if (!nitParam) {
        this.mensaje.set('NIT no proporcionado.');
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
    if (this.form.invalid || !this.estado()) {
      this.form.markAllAsTouched();
      return;
    }

    const nit = this.nit();
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
        this.auth.setSession(resp.nit, resp.token);
        this.router.navigate(['/gestion'], { queryParams: { nit, nombre: this.estado()?.nit ?? '' } });
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err?.error?.message || err?.error?.error?.message || 'No se pudo completar la acción.';
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
    // Autologin con la nueva clave
    this.mostrarRecuperacion.set(false);
    const nit = evt.nit;
    const clave = evt.clave;
    this.cargando.set(true);
    this.accesoService.login(nit, clave).subscribe({
      next: (resp) => {
        this.cargando.set(false);
        this.auth.setSession(resp.nit, resp.token);
        this.router.navigate(['/gestion'], { queryParams: { nit, nombre: this.estado()?.nit ?? '' } });
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err?.error?.message || err?.error?.error?.message || 'No se pudo completar la acción.';
        this.mensaje.set(msg);
      }
    });
  }
}
