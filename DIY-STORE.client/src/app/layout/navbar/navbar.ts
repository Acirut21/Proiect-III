import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CatalogApi } from '../../core/catalog-api';
import { PublicCategory } from '../../core/catalog.models';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogApi);
  private readonly router = inject(Router);
  protected readonly menuOpen = signal(false);
  protected readonly categoriesOpen = signal(false);
  protected readonly categories = signal<PublicCategory[]>([]);

  constructor() {
    this.catalog.categories().subscribe({ next: list => this.categories.set(list), error: () => undefined });
  }

  /** Trimite cautarea la pagina de rezultate; textul gol cauta in tot catalogul, ca in aplicatia veche. */
  protected search(term: string): void {
    this.closeMenu();
    void this.router.navigate(['/search'], { queryParams: { q: term.trim() } });
  }

  protected toggleCategories(): void {
    this.categoriesOpen.update(open => !open);
  }

  protected toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
    this.categoriesOpen.set(false);
  }

  protected logout(): void {
    this.closeMenu();
    this.auth.logout();
  }

  // Un click oriunde in afara meniului il inchide
  @HostListener('document:click')
  protected onDocumentClick(): void {
    this.closeMenu();
  }
}
