export interface ServicioItem {
  codigo: string;
  nombre: string;
  grupo: string;
  codHabilitacion: string;
  direccion: string;
  departamento: string;
  municipio: string;
  yaRegistrado?: boolean;
}

export interface DireccionServicios {
  codHabilitacion: string;
  direccion: string;
  departamento: string;
  municipio: string;
  servicios: ServicioItem[];
}
