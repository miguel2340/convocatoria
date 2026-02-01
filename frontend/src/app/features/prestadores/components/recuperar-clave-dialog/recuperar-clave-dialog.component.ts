import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, AbstractControl } from '@angular/forms';

import {
  AccesoService,
  PreguntaRecuperacion,
  RecuperacionPreguntasResponse,
  RecuperacionValidacionResponse
} from '../../../../core/services/acceso.service';
import { RepresentanteBasico, RepresentanteService } from '../../../../core/services/representante.service';

type PasoRecuperacion = 'preguntas' | 'datos' | 'clave';

@Component({
  selector: 'app-recuperar-clave-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recuperar-clave-dialog.component.html',
  styleUrl: './recuperar-clave-dialog.component.scss'
})
export class RecuperarClaveDialogComponent implements OnInit {
  @Input({ required: true }) nit!: string;
  @Output() cerrar = new EventEmitter<void>();
  @Output() claveRestablecida = new EventEmitter<{ nit: string; clave: string }>();

  paso = signal<PasoRecuperacion>('preguntas');
  cargando = signal(false);
  error = signal<string | null>(null);

  preguntas = signal<PreguntaRecuperacion[]>([]);
  desafioId = '';
  tokenRecuperacion = '';

  respuestasForm!: FormGroup;
  datosForm!: FormGroup;
  claveForm!: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly accesoService: AccesoService,
    private readonly representanteService: RepresentanteService
  ) {}

  ngOnInit(): void {
    // Inicializar formularios después de tener el FormBuilder
    this.respuestasForm = this.fb.group({});
    this.datosForm = this.fb.group({
      representanteLegal: ['', Validators.required],
      correoRepresentante: ['', [Validators.required, Validators.email]],
      celularRepresentante: ['', Validators.required],
      correoAdmin: ['', [Validators.email]]
    });
    this.claveForm = this.fb.group({
      clave: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(64)]],
      clave2: ['']
    });

    this.cargarPreguntas();
  }

  private cargarPreguntas() {
    this.cargando.set(true);
    this.error.set(null);
    this.accesoService.obtenerPreguntasRecuperacion(this.nit).subscribe({
      next: (resp: RecuperacionPreguntasResponse) => {
        this.desafioId = resp.desafioId;
        this.preguntas.set(resp.preguntas);
        // Crear controles dinámicos
        resp.preguntas.forEach((p) => {
          this.respuestasForm.addControl(p.id, this.fb.control('', Validators.required));
        });
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las preguntas de seguridad.');
        this.cargando.set(false);
      }
    });
  }

  validarPreguntas() {
    if (this.respuestasForm.invalid) {
      this.respuestasForm.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.accesoService
      .validarPreguntasRecuperacion({
        nit: this.nit,
        desafioId: this.desafioId,
        respuestas: this.respuestasForm.value as Record<string, string>
      })
      .subscribe({
        next: (resp: RecuperacionValidacionResponse) => {
          this.tokenRecuperacion = resp.tokenRecuperacion;
          this.datosForm.patchValue({
            representanteLegal: resp.representante.representanteLegal || '',
            correoRepresentante: resp.representante.correoRepresentante || '',
            celularRepresentante: resp.representante.celularRepresentante || '',
            correoAdmin: resp.representante.correoAdmin || ''
          });
          this.paso.set('datos');
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('Las respuestas no son correctas o el desafío expiró.');
          this.cargando.set(false);
        }
      });
  }

  confirmarDatos() {
    if (!this.tokenRecuperacion) return;
    if (this.datosForm.invalid) {
      this.datosForm.markAllAsTouched();
      return;
    }
    this.persistirDatos();
  }

  guardarDatos() {
    if (!this.tokenRecuperacion) return;
    if (this.datosForm.invalid) {
      this.datosForm.markAllAsTouched();
      return;
    }
    this.persistirDatos();
  }

  private persistirDatos() {
    const payload: { tokenRecuperacion: string } & RepresentanteBasico = {
      tokenRecuperacion: this.tokenRecuperacion,
      representanteLegal: this.datosForm.value.representanteLegal || '',
      correoRepresentante: this.datosForm.value.correoRepresentante || '',
      celularRepresentante: this.datosForm.value.celularRepresentante || '',
      correoAdmin: this.datosForm.value.correoAdmin || ''
    };

    this.cargando.set(true);
    this.error.set(null);
    this.representanteService.actualizarDesdeRecuperacion(payload).subscribe({
      next: () => {
        // Si era solo confirmación, igual pasamos a crear clave
        this.paso.set('clave');
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron guardar los datos del representante.');
        this.cargando.set(false);
      }
    });
  }

  guardarClave() {
    if (this.claveForm.invalid) {
      this.claveForm.markAllAsTouched();
      return;
    }
    const clave = this.claveForm.value.clave?.trim() ?? '';
    const clave2 = this.claveForm.value.clave2?.trim() ?? '';
    if (clave !== clave2) {
      this.error.set('Las claves no coinciden.');
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.accesoService
      .restablecerClaveRecuperacion({
        tokenRecuperacion: this.tokenRecuperacion,
        clave
      })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.claveRestablecida.emit({ nit: this.nit, clave });
        },
        error: () => {
          this.error.set('No se pudo restablecer la clave.');
          this.cargando.set(false);
        }
      });
  }

  cerrarDialogo() {
    this.cerrar.emit();
  }

  trackPregunta(_: number, item: PreguntaRecuperacion) {
    return item.id;
  }

  controlPregunta(id: string): AbstractControl | null {
    return this.respuestasForm.get(id);
  }

  estadoPaso = computed(() => ({
    esPreguntas: this.paso() === 'preguntas',
    esDatos: this.paso() === 'datos',
    esClave: this.paso() === 'clave'
  }));
}
