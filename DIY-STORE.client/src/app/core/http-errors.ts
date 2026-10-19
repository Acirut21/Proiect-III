import { HttpErrorResponse } from '@angular/common/http';

/** Extrage mesajele afisabile dintr-o eroare HTTP. API-ul intoarce { "errors": ["..."] }. */
export function extractErrors(err: unknown): string[] {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && Array.isArray(body.errors) && body.errors.length > 0) {
      return body.errors.map(String);
    }
    if (err.status === 0) {
      return ['Cannot reach the server. Make sure the API is running.'];
    }
  }
  return ['Something went wrong. Please try again.'];
}
