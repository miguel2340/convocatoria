import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import * as pbi from 'powerbi-client';

import { PowerBIService } from '../../../../core/services/powerbi.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PrestadoresService } from '../../../../core/services/prestadores.service';

@Component({
  selector: 'app-pagos-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagos-detalle.component.html',
  styleUrl: './pagos-detalle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PagosDetalleComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly powerBiService = inject(PowerBIService);
  private readonly auth = inject(AuthService);
  private readonly prestadoresService = inject(PrestadoresService);

  @ViewChild('pbiContainer', { static: true }) pbiContainer?: ElementRef<HTMLDivElement>;

  nit = signal('');
  periodo = signal('');
  cargando = signal<boolean>(true);
  mensaje = signal<string | null>(null);
  prestadorNombre = signal<string | null>(null);

  private powerbi = new pbi.service.Service(
    pbi.factories.hpmFactory,
    pbi.factories.wpmpFactory,
    pbi.factories.routerFactory
  );

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.nit.set(params.get('nit') ?? '');
      this.periodo.set(params.get('periodo') ?? '');
      const nitParam = params.get('nit');
      if (nitParam) {
        this.cargarPrestador(nitParam);
      } else {
        this.prestadorNombre.set(null);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.auth.isAuthenticated()) {
      // Sin token no podemos obtener el embed config.
      this.router.navigate(['/acceso-pagos'], { queryParams: { nit: this.nit(), periodo: this.periodo() } });
      return;
    }
    this.cargarReporte();
  }

  ngOnDestroy(): void {
    if (this.pbiContainer?.nativeElement) {
      this.powerbi.reset(this.pbiContainer.nativeElement);
    }
  }

  private cargarReporte() {
    this.cargando.set(true);
    this.mensaje.set(null);

    this.powerBiService.obtenerEmbedConfig().subscribe({
      next: (cfg) => {
        if (!this.pbiContainer) {
          this.cargando.set(false);
          this.mensaje.set('No se encontró el contenedor del reporte.');
          return;
        }

        const availableHeight = Math.max(window.innerHeight - 200, 400);
        this.pbiContainer.nativeElement.style.height = `${availableHeight}px`;

        this.powerbi.reset(this.pbiContainer.nativeElement);
        const embedConfig: pbi.models.IReportEmbedConfiguration = {
          type: 'report',
          id: cfg.reportId,
          embedUrl: cfg.embedUrl,
          accessToken: cfg.embedToken,
          tokenType: pbi.models.TokenType.Embed,
          permissions: pbi.models.Permissions.Read,
          settings: {
            panes: { filters: { visible: false }, pageNavigation: { visible: false } },
            navContentPaneEnabled: false,
            layoutType: pbi.models.LayoutType.Custom,
            customLayout: {
              displayOption: pbi.models.DisplayOption.FitToPage
            },
            background: pbi.models.BackgroundType.Transparent
          }
        };

        const report = this.powerbi.embed(this.pbiContainer.nativeElement, embedConfig) as pbi.Report;
        report.on('loaded', () => {
          this.cargando.set(false);
          report.updateSettings({
            background: pbi.models.BackgroundType.Transparent
          });
        });
        report.on('error', (event) => {
          // Capturamos errores del iframe (por ejemplo IDs incorrectos o sin permisos).
          const detail = (event as any)?.detail;
          console.error('Power BI embed error:', detail);
          this.mensaje.set(detail?.message || 'No se pudo cargar el reporte de Power BI.');
          this.cargando.set(false);
        });
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err?.error?.message || 'No se pudo cargar el reporte de Power BI.';
        this.mensaje.set(msg);
      }
    });
  }

  irAlBuscador() {
    this.router.navigate(['/'], { queryParams: { nit: this.nit() } });
  }

  private cargarPrestador(nit: string) {
    this.prestadoresService.searchByNit(nit).subscribe({
      next: (prestador) => {
        this.prestadorNombre.set(prestador?.nombre ?? null);
      },
      error: () => this.prestadorNombre.set(null)
    });
  }
}
