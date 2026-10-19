import { Routes } from '@angular/router';
import { adminGuard, guestGuard } from './core/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home').then(m => m.Home),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then(m => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register').then(m => m.Register),
  },
  {
    path: 'access-denied',
    loadComponent: () => import('./pages/access-denied/access-denied').then(m => m.AccessDenied),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin-home').then(m => m.AdminHome),
  },
  { path: '**', redirectTo: '' },
];
