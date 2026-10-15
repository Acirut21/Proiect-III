import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { HealthService } from '../../core/health.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  private readonly health = inject(HealthService);

  // undefined = se incarca, null = API indisponibil
  protected readonly status = toSignal(
    this.health.check().pipe(catchError(() => of(null)))
  );
}
