import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly auth = inject(AuthService);
  private readonly publicApiPaths = ['/api/pagos', '/api/acceso', '/actuator/health', '/actuator/info'];

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.token;
    const isApi = req.url.startsWith('/api');
    const isPublicApi = this.publicApiPaths.some(path => req.url.startsWith(path));

    if (!token || !isApi || isPublicApi) {
      return next.handle(req);
    }

    // Solo añadimos el header para llamadas protegidas de nuestra API.
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next.handle(authReq);
  }
}
