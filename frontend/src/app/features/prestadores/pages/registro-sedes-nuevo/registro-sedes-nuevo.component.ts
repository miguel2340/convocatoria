import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CatalogosService } from '../../../../core/services/catalogos.service';
import { RegistroNuevoService } from '../../../../core/services/registro-nuevo.service';
import { Departamento, Municipio } from '../../../../core/models/catalogos.model';
import { SoportesService } from '../../../../core/services/soportes.service';
import { RegistroStateService } from '../../../../core/services/registro-state.service';
import { PrestadorRegistroContext, SedeSeleccion } from '../../../../core/models/atencion-usuarios.model';

const TIPO_VIA = ['Calle', 'Carrera', 'Avenida', 'Transversal', 'Diagonal'];

@Component({
  selector: 'app-registro-sedes-nuevo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro-sedes-nuevo.component.html',
  styleUrl: './registro-sedes-nuevo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroSedesNuevoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogosService = inject(CatalogosService);
  private readonly registroNuevoService = inject(RegistroNuevoService);
  private readonly soportesService = inject(SoportesService);
  private readonly registroState = inject(RegistroStateService);

  departamentos = signal<Departamento[]>([]);
  municipiosPorSede = signal<Record<number, Municipio[]>>({});

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  uploading = signal(false);
  soportesOk = signal(false);

  contexto: Record<string, any> = {};
  categoriasSeleccion = { transporte: false, insumos: false, medicamentos: false };

  form = this.fb.group({
    sedes: this.fb.array<FormGroup>([])
  });

  get sedesArray() {
    return this.form.get('sedes') as FormArray<FormGroup>;
  }

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      params.keys.forEach((k) => (this.contexto[k] = params.get(k)));
      this.categoriasSeleccion = {
        transporte: (params.get('transporte') ?? 'false') === 'true',
        insumos: (params.get('insumos') ?? 'false') === 'true',
        medicamentos: (params.get('medicamentos') ?? 'false') === 'true'
      };
    });

    this.cargarDepartamentos();
    this.agregarSede();
  }

  cargarDepartamentos() {
    this.catalogosService.obtenerDepartamentos().subscribe({
      next: (deps) => this.departamentos.set(deps),
      error: () => this.error.set('No se pudieron cargar los departamentos.')
    });
  }

  cargarMunicipios(index: number, departamentoId: string) {
    if (!departamentoId) {
      this.municipiosPorSede.update((curr) => ({ ...curr, [index]: [] }));
      return;
    }
    this.catalogosService.obtenerMunicipios(departamentoId).subscribe({
      next: (data) => {
        this.municipiosPorSede.update((curr) => ({ ...curr, [index]: data }));
        // Limpiar municipio seleccionado si ya no aplica
        this.sedesArray.at(index).get('municipioId')?.setValue('');
      },
      error: () => this.error.set('No se pudieron cargar los municipios.')
    });
  }

  agregarSede() {
    const sede = this.fb.group({
      tipoVia: ['', Validators.required],
      numeroVia: ['', Validators.required],
      letraVia: [''],
      numeroPlaca: ['', Validators.required],
      departamentoId: ['', Validators.required],
      municipioId: ['', Validators.required],
      serviciosNoReps: [''],
      codigoPostal: ['']
    });
    const index = this.sedesArray.length;
    this.sedesArray.push(sede);
    this.municipiosPorSede.update((curr) => ({ ...curr, [index]: [] }));
  }

  eliminarSede(idx: number) {
    if (this.sedesArray.length === 1) {
      return;
    }
    this.sedesArray.removeAt(idx);
    const updated = { ...this.municipiosPorSede() };
    delete updated[idx];
    this.municipiosPorSede.set(updated);
  }

  submit() {
    if (!this.contexto['nit']) {
      this.error.set('Falta el NIT. Regresa y completa el formulario anterior.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completa los campos obligatorios de las sedes.');
      return;
    }

    this.verificarSoportes(() => this.enviarRegistro());
  }

  private enviarRegistro() {
    const payload = {
      nit: this.contexto['nit'],
      nombrePrestador: this.contexto['nombre'] ?? '',
      clasePrestador: this.contexto['clasePrestador'] ?? '',
      telefonoFijo: this.contexto['telefonoFijo'] ?? '',
      celularAdmin: this.contexto['celularAdmin'] ?? '',
      correoAdmin: this.contexto['correoAdmin'] ?? '',
      representanteLegal: this.contexto['representanteLegal'] ?? '',
      correoRepresentante: this.contexto['correoRepresentante'] ?? '',
      celularRepresentante: this.contexto['celularRepresentante'] ?? '',
      transporte: this.categoriasSeleccion.transporte,
      insumosMedicos: this.categoriasSeleccion.insumos,
      medicamentos: this.categoriasSeleccion.medicamentos,
      sedes: this.sedesArray.value
    };

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.registroNuevoService.registrar(payload).subscribe({
      next: () => {
        this.loading.set(false);
        const contexto = this.buildContexto();
        const sedesSeleccion = this.buildSedesSeleccion();
        this.registroState.setContexto(contexto);
        this.registroState.setSedes(sedesSeleccion);
        this.success.set('Sedes registradas correctamente. Redirigiendo al formulario de atención...');
        setTimeout(() => {
          this.router.navigate(['/datos-sedes'], {
            queryParams: { nit: contexto.nit, nombre: contexto.nombre },
            replaceUrl: true
          });
        }, 1200);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.error.set('No se pudo registrar las sedes. Intenta nuevamente.');
      }
    });
  }

  private verificarSoportes(done: () => void) {
    const nit = this.contexto['nit'];
    if (!nit) {
      this.error.set('Falta el NIT para validar soportes.');
      return;
    }

    this.loading.set(true);
    this.soportesService.check(nit).subscribe({
      next: (info) => {
        this.loading.set(false);
        if (info.existe && info.cantidad > 0) {
          this.soportesOk.set(true);
          done();
        } else {
          this.error.set('Debes adjuntar al menos un documento en la carpeta de soportes antes de continuar.');
        }
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.error.set('No se pudieron validar los soportes.');
      }
    });
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    const nit = this.contexto['nit'] ?? '';
    if (!nit || files.length === 0) {
      return;
    }
    this.uploading.set(true);
    this.soportesService.upload(nit, files).subscribe({
      next: () => {
        this.uploading.set(false);
        this.soportesOk.set(true);
        this.success.set('Archivos cargados correctamente.');
      },
      error: (err) => {
        console.error(err);
        this.uploading.set(false);
        this.error.set('No se pudieron cargar los archivos.');
      }
    });
  }

  tiposVia() {
    return TIPO_VIA;
  }

  private buildContexto(): PrestadorRegistroContext {
    return {
      nit: this.contexto['nit'],
      nombre: this.contexto['nombre'],
      clasePrestador: this.contexto['clasePrestador'],
      telefonoFijo: this.contexto['telefonoFijo'],
      celularAdmin: this.contexto['celularAdmin'],
      correoAdmin: this.contexto['correoAdmin'],
      representanteLegal: this.contexto['representanteLegal'],
      correoRepresentante: this.contexto['correoRepresentante'],
      celularRepresentante: this.contexto['celularRepresentante']
    };
  }

  private buildSedesSeleccion(): SedeSeleccion[] {
    return this.sedesArray.controls.map((ctrl, index) => {
      const val = ctrl.value as any;
      const dep = this.departamentos().find((d) => d.id === val.departamentoId);
      const mun = (this.municipiosPorSede()[index] ?? []).find((m) => m.id === val.municipioId);
      const direccion = this.construirDireccion(val);
      return {
        codHabilitacion: '001705',
        direccion,
        departamento: dep?.nombre ?? '',
        municipio: mun?.nombre ?? '',
        servicios: []
      };
    });
  }

  private construirDireccion(val: any) {
    let dir = `${val.tipoVia} ${val.numeroVia}`;
    if (val.letraVia) dir += ` ${val.letraVia}`;
    dir += ` # ${val.numeroPlaca}`;
    return dir.trim();
  }
}
