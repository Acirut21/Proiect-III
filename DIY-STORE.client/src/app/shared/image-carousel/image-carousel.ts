import { Component, computed, input, signal } from '@angular/core';

/**
 * Galerie simpla de imagini (fara JavaScript Bootstrap): sageti, puncte optionale, o singura imagine
 * vizibila. Fara nicio imagine arata un spatiu gol cu textul "No image".
 */
@Component({
  selector: 'app-image-carousel',
  templateUrl: './image-carousel.html',
})
export class ImageCarousel {
  readonly images = input<string[]>([]);
  readonly alt = input('');
  /** Inaltimea zonei, in pixeli. */
  readonly height = input(200);
  readonly dots = input(false);

  protected readonly index = signal(0);
  protected readonly safeIndex = computed(() => Math.min(this.index(), Math.max(this.images().length - 1, 0)));

  protected move(step: number): void {
    const count = this.images().length;
    this.index.set((this.safeIndex() + step + count) % count);
  }

  protected goTo(position: number): void {
    this.index.set(position);
  }
}
