import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AtencionUsuariosService } from '../../../../core/services/atencion-usuarios.service';
import { RegistroStateService } from '../../../../core/services/registro-state.service';
import { DatosSedePayload, SedeSeleccion } from '../../../../core/models/atencion-usuarios.model';

const PHONE_PATTERN = /^[0-9]{1,10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-formulario-sedes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './formulario-sedes.component.html',
  styleUrl: './formulario-sedes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormularioSedesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly atencionService = inject(AtencionUsuariosService);
  private readonly registroState = inject(RegistroStateService);

  readonly contexto = this.registroState.obtenerContexto();
  readonly sedesSeleccionadas = this.registroState.obtenerSedes();

  readonly abiertas = signal<Record<string, boolean>>({});
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly sedeErrors = signal<Record<string, string>>({});

  form = this.fb.group({
    sedes: this.fb.array<FormGroup>([])
  });

  constructor() {
    if (!this.contexto || !this.sedesSeleccionadas.length) {
      this.error.set('No encontramos sedes seleccionadas. Regresa al paso anterior para elegir servicios.');
      return;
    }

    this.sedesSeleccionadas.forEach((sede, idx) => {
      this.sedesFormArray.push(this.crearFormularioSede(sede));
      this.abiertas.update((curr) => ({ ...curr, [sede.codHabilitacion]: idx === 0 }));
    });
  }

  get sedesFormArray() {
    return this.form.get('sedes') as FormArray<FormGroup>;
  }

  toggleSede(codHabilitacion: string) {
    this.abiertas.update((curr) => ({ ...curr, [codHabilitacion]: !curr[codHabilitacion] }));
  }

  mecanismoActual(index: number) {
    return this.sedesFormArray.at(index).get('mecanismoCitas')?.value as string;
  }

  tiposSeleccionados(index: number) {
    const group = this.sedesFormArray.at(index).get('tipoServicio') as FormGroup;
    const valores = group?.value ?? {};
    return Object.entries(valores)
      .filter(([, checked]) => !!checked)
      .map(([tipo]) => tipo);
  }

  private tiposSeleccionadosGroup(group: FormGroup) {
    const valores = (group.get('tipoServicio') as FormGroup)?.value ?? {};
    return Object.entries(valores)
      .filter(([, checked]) => !!checked)
      .map(([tipo]) => tipo);
  }

  debeMostrarGerente(tipos: string[]) {
    return tipos.length > 0;
  }

  debeMostrarCoordinador(tipos: string[]) {
    return tipos.some((tipo) => ['Hospitalario', 'Domiciliario', 'Transporte'].includes(tipo));
  }

  enviar() {
    if (!this.contexto) {
      this.error.set('No hay contexto de prestador. Vuelve a seleccionar servicios.');
      return;
    }

    const erroresPorSede: Record<string, string> = {};
    const sedesPayload: DatosSedePayload[] = [];

    this.sedesFormArray.controls.forEach((ctrl) => {
      const sedeGroup = ctrl as FormGroup;
      const codigo = sedeGroup.get('codHabilitacion')?.value;
      const error = this.validarSede(sedeGroup);
      if (error) {
        erroresPorSede[codigo] = error;
      } else {
        sedesPayload.push(this.mapearPayload(sedeGroup));
      }
    });

    this.sedeErrors.set(erroresPorSede);

    if (Object.keys(erroresPorSede).length > 0) {
      this.error.set('Revisa los campos pendientes en cada sede.');
      return;
    }

    const payload = {
      nit: this.contexto.nit,
      sedes: sedesPayload
    };

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.atencionService.registrar(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.registroState.limpiar();
        this.success.set('Información de sedes registrada correctamente. Redirigiendo al inicio...');
        setTimeout(() => {
          this.router.navigate(['/'], { queryParams: { mensaje: 'registro-sedes-ok' }, replaceUrl: true });
        }, 1200);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.error.set('No se pudo enviar el formulario por sede.');
      }
    });
  }

  private crearFormularioSede(sede: SedeSeleccion) {
    return this.fb.group({
      codHabilitacion: [sede.codHabilitacion],
      direccion: [sede.direccion],
      departamento: [sede.departamento],
      municipio: [sede.municipio],
      tipoServicio: this.fb.group({
        Ambulatorio: [false],
        Hospitalario: [false],
        Domiciliario: [false],
        Transporte: [false],
        Insumos: [false]
      }),
      servicioExclusivo: [false],
      servicioAgenda: [false],
      servicioFranjas: [false],
      mecanismoCitas: [''],
      horariosPresencial: this.fb.group({
        desde: [''],
        hasta: ['']
      }),
      canalesNoPresencial: this.fb.group({
        whatsapp: [''],
        whatsappDesde: [''],
        whatsappHasta: [''],
        telefono: [''],
        telefonoDesde: [''],
        telefonoHasta: [''],
        paginaWeb: [''],
        correo: ['']
      }),
      gerente: this.fb.group({
        nombre1: [''],
        nombre2: [''],
        apellido1: [''],
        apellido2: [''],
        correoAutorizado: [''],
        telefonoFijo: [''],
        celular: [''],
        correoGerente: [''],
        celularGerente: [''],
        correoAdministrativo: [''],
        telefonoAdministrativo: [''],
        celularAdministrativo: ['']
      }),
      coordinador: this.fb.group({
        nombre1: [''],
        nombre2: [''],
        apellido1: [''],
        apellido2: [''],
        telefono: [''],
        correo: ['']
      })
    });
  }

  private validarSede(group: FormGroup) {
    const tipos = this.tiposSeleccionadosGroup(group);
    if (tipos.length === 0) {
      return 'Selecciona al menos un tipo de servicio.';
    }

    const mecanismo = (group.get('mecanismoCitas')?.value ?? '').trim();
    if (!mecanismo) {
      return 'Selecciona un mecanismo de asignación de citas.';
    }

    const horariosPresencial = group.get('horariosPresencial')?.value ?? {};
    const canales = group.get('canalesNoPresencial')?.value ?? {};

    if (mecanismo === 'Presencial' || mecanismo === 'Ambos') {
      if (!horariosPresencial.desde || !horariosPresencial.hasta) {
        return 'Completa los horarios de atención presencial.';
      }
    }

    if (mecanismo === 'No Presencial' || mecanismo === 'Ambos') {
      if (!canales.whatsapp || !PHONE_PATTERN.test(canales.whatsapp)) {
        return 'WhatsApp es obligatorio y debe tener hasta 10 dígitos.';
      }
      if (!canales.whatsappDesde || !canales.whatsappHasta) {
        return 'Completa el horario de WhatsApp.';
      }
      if (!canales.telefono || !PHONE_PATTERN.test(canales.telefono)) {
        return 'La línea telefónica es obligatoria y debe tener hasta 10 dígitos.';
      }
      if (!canales.telefonoDesde || !canales.telefonoHasta) {
        return 'Completa el horario telefónico.';
      }
      if (!canales.paginaWeb) {
        return 'La página web es obligatoria para este mecanismo.';
      }
      if (!canales.correo || !EMAIL_PATTERN.test(canales.correo)) {
        return 'El correo de contacto no presencial es obligatorio y debe ser válido.';
      }
    }

    if (this.debeMostrarGerente(tipos)) {
      const g = group.get('gerente')?.value ?? {};
      const requeridos = [
        'nombre1',
        'apellido1',
        'correoAutorizado',
        'telefonoFijo',
        'celular',
        'correoGerente',
        'celularGerente',
        'correoAdministrativo',
        'telefonoAdministrativo',
        'celularAdministrativo'
      ];

      for (const campo of requeridos) {
        if (!g[campo]) {
          return 'Completa todos los campos del gerente o director científico.';
        }
      }

      const telefonos = [
        g.telefonoFijo,
        g.celular,
        g.celularGerente,
        g.telefonoAdministrativo,
        g.celularAdministrativo
      ];

      if (telefonos.some((tel: string) => !PHONE_PATTERN.test(tel))) {
        return 'Los teléfonos del gerente/administrativo deben tener máximo 10 dígitos.';
      }

      const correos = [g.correoAutorizado, g.correoGerente, g.correoAdministrativo];
      if (correos.some((mail: string) => !EMAIL_PATTERN.test(mail))) {
        return 'Verifica los correos del gerente/administrativo.';
      }
    }

    if (this.debeMostrarCoordinador(tipos)) {
      const c = group.get('coordinador')?.value ?? {};
      const requeridos = ['nombre1', 'apellido1', 'telefono', 'correo'];
      for (const campo of requeridos) {
        if (!c[campo]) {
          return 'Completa los datos del coordinador del Sistema de Referencia.';
        }
      }
      if (!PHONE_PATTERN.test(c.telefono)) {
        return 'El teléfono del coordinador debe tener máximo 10 dígitos.';
      }
      if (!EMAIL_PATTERN.test(c.correo)) {
        return 'El correo del coordinador no es válido.';
      }
    }

    return null;
  }

  private mapearPayload(group: FormGroup): DatosSedePayload {
    const tipos = this.tiposSeleccionadosGroup(group);
    const mecanismo = group.get('mecanismoCitas')?.value ?? '';
    const horariosPresencial = group.get('horariosPresencial')?.value ?? {};
    const canales = group.get('canalesNoPresencial')?.value ?? {};
    const gerente = group.get('gerente')?.value ?? {};
    const coordinador = group.get('coordinador')?.value ?? {};

    const payload: DatosSedePayload = {
      codHabilitacion: group.get('codHabilitacion')?.value ?? '',
      direccion: group.get('direccion')?.value ?? '',
      departamento: group.get('departamento')?.value ?? '',
      municipio: group.get('municipio')?.value ?? '',
      tipoServicio: tipos,
      servicioExclusivo: !!group.get('servicioExclusivo')?.value,
      servicioAgenda: !!group.get('servicioAgenda')?.value,
      servicioFranjas: !!group.get('servicioFranjas')?.value,
      mecanismoCitas: mecanismo
    };

    if (mecanismo === 'Presencial' || mecanismo === 'Ambos') {
      payload.horarioPresencial = {
        desde: horariosPresencial.desde,
        hasta: horariosPresencial.hasta
      };
    }

    if (mecanismo === 'No Presencial' || mecanismo === 'Ambos') {
      payload.whatsapp = canales.whatsapp;
      payload.horarioWhatsapp = {
        desde: canales.whatsappDesde,
        hasta: canales.whatsappHasta
      };
      payload.lineaTelefonica = canales.telefono;
      payload.horarioTelefono = {
        desde: canales.telefonoDesde,
        hasta: canales.telefonoHasta
      };
      payload.paginaWeb = canales.paginaWeb;
      payload.correoNoPresencial = canales.correo;
    }

    if (this.debeMostrarGerente(tipos)) {
      payload.gerente = {
        nombre: this.unirNombres([gerente.nombre1, gerente.nombre2, gerente.apellido1, gerente.apellido2]),
        correoAutorizado: gerente.correoAutorizado,
        telefonoFijo: gerente.telefonoFijo,
        celular: gerente.celular,
        correoGerente: gerente.correoGerente,
        celularGerente: gerente.celularGerente,
        correoAdministrativo: gerente.correoAdministrativo,
        telefonoAdministrativo: gerente.telefonoAdministrativo,
        celularAdministrativo: gerente.celularAdministrativo
      };
    }

    if (this.debeMostrarCoordinador(tipos)) {
      payload.coordinador = {
        nombre: this.unirNombres([
          coordinador.nombre1,
          coordinador.nombre2,
          coordinador.apellido1,
          coordinador.apellido2
        ]),
        telefono: coordinador.telefono,
        correo: coordinador.correo
      };
    }

    payload.servicios = this.sedesSeleccionadas.find(
      (s) => s.codHabilitacion === payload.codHabilitacion
    )?.servicios;

    return payload;
  }

  private unirNombres(valores: Array<string | undefined>) {
    return valores
      .map((v) => (v ?? '').trim())
      .filter(Boolean)
      .join(' ');
  }
}
