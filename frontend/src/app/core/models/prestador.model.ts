export interface Prestador {
  nit: string;
  nombre: string;
  clasePrestador?: string;
  estado?: string;
  telefonoFijo?: string;
  celularAdmin?: string;
  correoAdmin?: string;
  representanteLegal?: string;
  correoRepresentante?: string;
  celularRepresentante?: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T;
  errors?: ApiError[];
}
