import { Component, OnDestroy, input, output, signal } from '@angular/core';

/**
 * Camp pentru o singura imagine: arata imaginea curenta (daca exista), previzualizeaza fisierul ales
 * si anunta formularul parinte prin `fileChange`.
 */
@Component({
  selector: 'app-image-input',
  templateUrl: './image-input.html',
})
export class ImageInput implements OnDestroy {
  readonly label = input.required<string>();
  /** Calea imaginii existente, relativa la /images (ex. "categories/abc.webp"). */
  readonly currentPath = input<string | null>(null);
  readonly hint = input('');
  readonly fileChange = output<File | null>();

  protected readonly previewUrl = signal<string | null>(null);
  protected readonly fileName = signal<string | null>(null);

  protected onSelect(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.item(0) ?? null;

    this.release();
    if (file) {
      this.previewUrl.set(URL.createObjectURL(file));
      this.fileName.set(file.name);
    }
    this.fileChange.emit(file);
  }

  ngOnDestroy(): void {
    this.release();
  }

  private release(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
    this.fileName.set(null);
  }
}
