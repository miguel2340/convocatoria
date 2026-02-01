import { ServicioItem } from './servicios.model';

export interface PrestadorRegistroContext {
  nit: string;
  nombre?: string | null;
  clasePrestador?: string | null;
  telefonoFijo?: string | null;
  celularAdmin?: string | null;
  correoAdmin?: string | null;
  representanteLegal?: string | null;
  correoRepresentante?: string | null;
  celularRepresentante?: string | null;
}

export interface SedeSeleccion {
  codHabilitacion: string;
  direccion: string;
  departamento: string;
  municipio: string;
  servicios: ServicioItem[];
}

export interface DatosSedePayload {
  codHabilitacion: string;
  direccion: string;
  departamento: string;
  municipio: string;
  tipoServicio: string[];
  servicioExclusivo: boolean;
  servicioAgenda: boolean;
  servicioFranjas: boolean;
  mecanismoCitas: 'Presencial' | 'No Presencial' | 'Ambos';
  horarioPresencial?: { desde?: string; hasta?: string };
  whatsapp?: string;
  horarioWhatsapp?: { desde?: string; hasta?: string };
  lineaTelefonica?: string;
  horarioTelefono?: { desde?: string; hasta?: string };
  paginaWeb?: string;
  correoNoPresencial?: string;
  gerente?: {
    nombre: string;
    correoAutorizado: string;
    telefonoFijo: string;
    celular: string;
    correoGerente: string;
    celularGerente: string;
    correoAdministrativo: string;
    telefonoAdministrativo: string;
    celularAdministrativo: string;
  };
  coordinador?: {
    nombre: string;
    telefono: string;
    correo: string;
  };
  servicios?: ServicioItem[];
}

export interface RegistroAtencionRequest {
  nit: string;
  sedes: DatosSedePayload[];
}
