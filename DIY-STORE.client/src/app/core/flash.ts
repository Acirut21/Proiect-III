import { Injectable, signal } from '@angular/core';

/**
 * Mesaj de succes care supravietuieste unei navigari (echivalentul TempData din aplicatia veche):
 * formularul il seteaza, pagina de lista il afiseaza o singura data.
 */
@Injectable({ providedIn: 'root' })
export class Flash {
  private readonly message = signal<string | null>(null);

  set(text: string): void {
    this.message.set(text);
  }

  /** Intoarce mesajul curent si il sterge. */
  consume(): string | null {
    const text = this.message();
    this.message.set(null);
    return text;
  }
}
