export interface PagoRadicacionItem {
  nit: string;
  prefijoFactura: string;
  fechaRadicacion: string;
  valorFacturado: number;
  valorPagado: number;
  fechaPago: string | null;
}

export interface PagoRadicacionPage {
  nit: string;
  fechaInicio: string;
  fechaFin: string;
  prefijo?: string | null;
  page: number;
  size: number;
  hasNext: boolean;
  totalRows: number;
  totalFacturado: number;
  totalPagado: number;
  totalPendiente: number;
  items: PagoRadicacionItem[];
}
