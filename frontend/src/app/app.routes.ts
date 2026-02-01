import { Routes } from '@angular/router';
import { BuscarPrestadorComponent } from './features/prestadores/pages/buscar-prestador/buscar-prestador.component';
import { AccesoPrestadorComponent } from './features/prestadores/pages/acceso-prestador/acceso-prestador.component';
import { ConvocatoriaSaludComponent } from './features/prestadores/pages/convocatoria-salud/convocatoria-salud.component';
import { RegistroServiciosComponent } from './features/prestadores/pages/registro-servicios/registro-servicios.component';
import { FormularioSedesComponent } from './features/prestadores/pages/formulario-sedes/formulario-sedes.component';
import { RegistroSedesNuevoComponent } from './features/prestadores/pages/registro-sedes-nuevo/registro-sedes-nuevo.component';
import { RegistroSstSedesComponent } from './features/prestadores/pages/registro-sst-sedes/registro-sst-sedes.component';
import { MenuPrestadorComponent } from './features/prestadores/pages/menu-prestador/menu-prestador.component';
import { MenuSstComponent } from './features/prestadores/pages/menu-sst/menu-sst.component';
import { MenuActualizarComponent } from './features/prestadores/pages/menu-actualizar/menu-actualizar.component';
import { ActualizarRepresentanteComponent } from './features/prestadores/pages/actualizar-representante/actualizar-representante.component';
import { ActualizarAtencionComponent } from './features/prestadores/pages/actualizar-atencion/actualizar-atencion.component';
import { EditarAtencionComponent } from './features/prestadores/pages/editar-atencion/editar-atencion.component';
import { ArchivosComponent } from './features/prestadores/pages/archivos/archivos.component';
import { SubsanacionComponent } from './features/prestadores/pages/subsanacion/subsanacion.component';
import { AccesoPagosComponent } from './features/prestadores/pages/acceso-pagos/acceso-pagos.component';
import { PagosDetalleComponent } from './features/prestadores/pages/pagos-detalle/pagos-detalle.component';

export const routes: Routes = [
  {
    path: '',
    component: BuscarPrestadorComponent,
    data: {
      tab: 'convocatoria',
      brandTitle: 'Convocatoria Salud y SST',
      brandSubtitle: 'Registro calificado de prestadores'
    }
  },
  {
    path: 'pagos',
    component: BuscarPrestadorComponent,
    data: {
      tab: 'pagos',
      brandTitle: 'Proceso de pagos',
      brandSubtitle: 'Consulta y detalle por NIT'
    }
  },
  { path: 'acceso', component: AccesoPrestadorComponent },
  {
    path: 'acceso-pagos',
    component: AccesoPagosComponent,
    data: {
      tab: 'pagos',
      brandTitle: 'Proceso de pagos',
      brandSubtitle: 'Acceso con clave NIT'
    }
  },
  {
    path: 'pagos/detalle',
    component: PagosDetalleComponent,
    data: {
      tab: 'pagos',
      brandTitle: 'Proceso de pagos',
      brandSubtitle: 'Detalle de pagos'
    }
  },
  { path: 'convocatoria-salud', component: ConvocatoriaSaludComponent },
  { path: 'registro-servicios', component: RegistroServiciosComponent },
  { path: 'datos-sedes', component: FormularioSedesComponent },
  { path: 'registro-sedes-nuevo', component: RegistroSedesNuevoComponent },
  { path: 'registro-sst-sedes', component: RegistroSstSedesComponent },
  { path: 'menu-sst', component: MenuSstComponent },
  { path: 'actualizar-datos', component: MenuActualizarComponent },
  { path: 'actualizar-representante', component: ActualizarRepresentanteComponent },
  { path: 'actualizar-atencion', component: ActualizarAtencionComponent },
  { path: 'editar-atencion', component: EditarAtencionComponent },
  { path: 'archivos', component: ArchivosComponent },
  { path: 'subsanacion', component: SubsanacionComponent },
  { path: 'gestion', component: MenuPrestadorComponent },
  { path: '**', redirectTo: '' }
];
