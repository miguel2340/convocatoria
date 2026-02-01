import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

const DEFAULT_BRAND_TITLE = 'Convocatoria Salud y SST';
const DEFAULT_BRAND_SUBTITLE = 'Registro calificado de prestadores';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  brandTitle = signal(DEFAULT_BRAND_TITLE);
  brandSubtitle = signal(DEFAULT_BRAND_SUBTITLE);
  activeTab = signal<'convocatoria' | 'pagos'>('convocatoria');

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.updateBranding());
    this.updateBranding();
  }

  private updateBranding() {
    let child = this.route.firstChild;
    while (child?.firstChild) {
      child = child.firstChild;
    }

    const data = child?.snapshot.data ?? {};

    this.brandTitle.set(data['brandTitle'] ?? DEFAULT_BRAND_TITLE);
    this.brandSubtitle.set(data['brandSubtitle'] ?? DEFAULT_BRAND_SUBTITLE);

    const tab = data['tab'] as 'convocatoria' | 'pagos' | undefined;
    this.activeTab.set(tab === 'pagos' ? 'pagos' : 'convocatoria');
  }
}
