import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toasts',
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index:1100" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <div class="alert alert-{{ t.kind }} shadow d-flex align-items-start gap-3 mb-2" role="status">
          <span class="flex-grow-1">{{ t.text }}</span>
          <button type="button" class="btn-close" aria-label="Close" (click)="toasts.dismiss(t.id)"></button>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  protected readonly toasts = inject(ToastService);
}
