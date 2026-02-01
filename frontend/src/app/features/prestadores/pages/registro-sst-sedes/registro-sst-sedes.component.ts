import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CatalogosService } from '../../../../core/services/catalogos.service';
import { SoportesService } from '../../../../core/services/soportes.service';
import { RegistroSstService } from '../../../../core/services/registro-sst.service';
import { Departamento, Municipio } from '../../../../core/models/catalogos.model';

const SERVICIOS_SST = [
  'Evaluaciones Médicas Ocupacionales',
  'Consultas de Medicina Laboral',
  'Determinación de Origen',
  'Calificación de Pérdida de Capacidad Laboral',
  'Implementación del SG-SST'
];

const TIPO_VIA = ['Calle', 'Carrera', 'Avenida', 'Transversal', 'Diagonal'];

const DOCUMENTOS_SST = [
  { categoria: 'Jurídicos', nombre: 'Certificado de existencia y representación legal (≤30 días)', clave: 'certificado_existencia' },
  { categoria: 'Jurídicos', nombre: 'Cédula del representante legal', clave: 'cedula_representante' },
  { categoria: 'Jurídicos', nombre: 'Acta de nombramiento y posesión (si aplica)', clave: 'acta_nombramiento' },
  { categoria: 'Jurídicos', nombre: 'Cédula y tarjeta profesional del revisor fiscal + certificado (si aplica)', clave: 'revisor_fiscal' },
  { categoria: 'Jurídicos', nombre: 'RUT de la persona jurídica', clave: 'rut' },
  { categoria: 'Jurídicos', nombre: 'Anexo 4 - Carta de Manifestación de interés (PDF legible)', clave: 'anexo_4' },
  { categoria: 'Jurídicos', nombre: 'Antecedentes disciplinarios (PJ y representante)', clave: 'ant_disciplinarios' },
  { categoria: 'Jurídicos', nombre: 'Antecedentes fiscales (PJ y representante)', clave: 'ant_fiscales' },
  { categoria: 'Jurídicos', nombre: 'Antecedentes judiciales (PJ y representante)', clave: 'ant_judiciales' },
  { categoria: 'Jurídicos', nombre: 'Certificado de delitos sexuales (representante)', clave: 'delitos_sexuales' },
  { categoria: 'Jurídicos', nombre: 'Certificado de medidas correctivas (representante)', clave: 'medidas_correctivas' },
  { categoria: 'Técnicos', nombre: 'Licencia SST vigente (persona jurídica)', clave: 'licencia_sst' },
  { categoria: 'Técnicos', nombre: 'Reporte REPS habilitación servicios (Excel completo)', clave: 'reporte_reps' },
  { categoria: 'Financieros', nombre: 'Estados financieros 2 últimas vigencias (PDF con notas)', clave: 'estados_financieros' },
  { categoria: 'Financieros', nombre: 'RUP vigente', clave: 'rup' }
];

@Component({
  selector: 'app-registro-sst-sedes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro-sst-sedes.component.html',
  styleUrl: './registro-sst-sedes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroSstSedesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogosService = inject(CatalogosService);
  private readonly soportesService = inject(SoportesService);
  private readonly registroSstService = inject(RegistroSstService);

  departamentos = signal<Departamento[]>([]);
  municipiosPorSede = signal<Record<number, Municipio[]>>({});

  loading = signal(false);
  uploading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  soportesOk = signal(false);
  modalSoportes = signal(false);
  docIndex = signal(0);
  docMensaje = signal<string | null>(null);
  docSubiendo = signal(false);
  docError = signal<string | null>(null);

  contexto: Record<string, any> = {};

  form = this.fb.group({
    sedes: this.fb.array<FormGroup>([])
  });

  get sedesArray() {
    return this.form.get('sedes') as FormArray<FormGroup>;
  }

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      params.keys.forEach((k) => (this.contexto[k] = params.get(k)));
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
        this.sedesArray.at(index).get('municipioId')?.setValue('');
      },
      error: () => this.error.set('No se pudieron cargar los municipios.')
    });
  }

  agregarSede() {
    const serviciosGroup = this.fb.group(
      SERVICIOS_SST.reduce((acc, serv) => {
        acc[serv] = [false];
        return acc;
      }, {} as Record<string, any>)
    );

    const sede = this.fb.group({
      tipoVia: ['', Validators.required],
      numeroVia: ['', Validators.required],
      letraVia: [''],
      numeroPlaca: ['', Validators.required],
      departamentoId: ['', Validators.required],
      municipioId: ['', Validators.required],
      servicios: serviciosGroup,
      codigoPostal: ['']
    });
    const idx = this.sedesArray.length;
    this.sedesArray.push(sede);
    this.municipiosPorSede.update((curr) => ({ ...curr, [idx]: [] }));
  }

  eliminarSede(idx: number) {
    if (this.sedesArray.length === 1) return;
    this.sedesArray.removeAt(idx);
    const updated = { ...this.municipiosPorSede() };
    delete updated[idx];
    this.municipiosPorSede.set(updated);
  }

  submit() {
    if (!this.contexto['nit']) {
      this.error.set('Falta el NIT. Regresa al paso anterior.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completa los campos obligatorios.');
      return;
    }

    // Validar que cada sede tenga al menos un servicio seleccionado
    for (const ctrl of this.sedesArray.controls) {
      const servicios = ctrl.get('servicios')?.value ?? {};
      const seleccion = Object.values(servicios).some((v) => !!v);
      if (!seleccion) {
        this.error.set('Cada sede debe tener al menos un servicio SST seleccionado.');
        return;
      }
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
      sedes: this.sedesArray.controls.map((ctrl, idx) => {
        const v = ctrl.value as any;
        return {
          tipoVia: v.tipoVia,
          numeroVia: v.numeroVia,
          letraVia: v.letraVia,
          numeroPlaca: v.numeroPlaca,
          departamentoId: v.departamentoId,
          municipioId: v.municipioId,
          codigoPostal: v.codigoPostal,
          servicios: Object.entries(v.servicios || {})
            .filter(([, checked]) => !!checked)
            .map(([nombre]) => nombre)
        };
      })
    };

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.registroSstService.registrar(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Sedes SST registradas correctamente. Redirigiendo al inicio...');
        setTimeout(() => {
          this.router.navigate(['/'], { replaceUrl: true });
        }, 1200);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.error.set('No se pudo registrar las sedes SST.');
      }
    });
  }

  private verificarSoportes(done: () => void) {
    const nit = this.contexto['nit'];
    this.loading.set(true);
    this.soportesService.check(nit, 'sst').subscribe({
      next: (info) => {
        this.loading.set(false);
        if (info.existe && info.cantidad > 0) {
          this.soportesOk.set(true);
          done();
        } else {
          this.error.set('Debes adjuntar al menos un documento en la carpeta de soportes antes de continuar.');
          this.abrirModalSoportes();
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
    if (!nit || files.length === 0) return;
    this.uploading.set(true);
    this.soportesService.upload(nit, files, 'sst').subscribe({
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

  abrirModalSoportes() {
    this.modalSoportes.set(true);
    this.docIndex.set(0);
    this.docMensaje.set(null);
    this.docError.set(null);
  }

  cerrarModalSoportes() {
    this.modalSoportes.set(false);
  }

  docActual() {
    return DOCUMENTOS_SST[this.docIndex()];
  }

  totalDocs() {
    return DOCUMENTOS_SST.length;
  }

  siguienteDoc() {
    const siguiente = this.docIndex() + 1;
    if (siguiente >= DOCUMENTOS_SST.length) {
      this.cerrarModalSoportes();
      return;
    }
    this.docIndex.set(siguiente);
    this.docMensaje.set(null);
    this.docError.set(null);
  }

  anteriorDoc() {
    const previo = this.docIndex() - 1;
    if (previo < 0) return;
    this.docIndex.set(previo);
    this.docMensaje.set(null);
    this.docError.set(null);
  }

  onDocFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const nit = this.contexto['nit'] ?? '';
    if (!nit || !file) return;

    this.docSubiendo.set(true);
    this.docMensaje.set(null);
    this.docError.set(null);

    this.soportesService.upload(nit, [file], 'sst').subscribe({
      next: () => {
        this.docSubiendo.set(false);
        const siguiente = this.docIndex() + 1;
        const ultimo = siguiente >= DOCUMENTOS_SST.length;
        this.docMensaje.set('Archivo cargado correctamente.');
        if (ultimo) {
          this.soportesOk.set(true);
          setTimeout(() => {
            this.cerrarModalSoportes();
            this.success.set('Soportes SST cargados. Continúa con el registro de sedes.');
          }, 600);
        } else {
          setTimeout(() => {
            this.docIndex.set(siguiente);
            this.docMensaje.set(null);
            input.value = '';
          }, 600);
        }
      },
      error: (err) => {
        console.error(err);
        this.docSubiendo.set(false);
        this.docError.set('No se pudo cargar este archivo. Intenta de nuevo.');
      }
    });
  }

  serviciosSst() {
    return SERVICIOS_SST;
  }

  tiposVia() {
    return TIPO_VIA;
  }
}
