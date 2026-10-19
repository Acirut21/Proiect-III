import { Component } from '@angular/core';

/** Pagina temporara a zonei de administrare; administrarea produselor se adauga in etapa urmatoare. */
@Component({
  selector: 'app-admin-home',
  template: `
    <h1 class="h3 mb-3">Admin</h1>
    <p class="text-muted mb-0">
      Zona de administrare este accesibila doar contului de administrator.
      Gestionarea produselor si a categoriilor urmeaza in etapele urmatoare.
    </p>
  `,
})
export class AdminHome {}
