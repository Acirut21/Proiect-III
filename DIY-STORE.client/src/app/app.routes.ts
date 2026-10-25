import { Routes } from '@angular/router';
import { adminGuard, guestGuard } from './core/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home').then(m => m.Home),
  },
  {
    path: 'products',
    pathMatch: 'full',
    loadComponent: () => import('./pages/catalog/product-list').then(m => m.ProductList),
  },
  {
    path: 'products/:slug',
    loadComponent: () => import('./pages/catalog/product-details').then(m => m.ProductDetails),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/catalog/search-results').then(m => m.SearchResults),
  },
  {
    path: 'promotions',
    data: { promotions: true },
    loadComponent: () => import('./pages/catalog/product-list').then(m => m.ProductList),
  },
  {
    path: 'categories/:slug',
    loadComponent: () => import('./pages/catalog/category-page').then(m => m.CategoryPage),
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
    // Toata zona de administrare cere rolul Admin (verificat si la fiecare navigare intre pagini)
    path: 'admin',
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/admin/admin-home').then(m => m.AdminHome),
      },

      // Produse
      {
        path: 'products',
        loadComponent: () => import('./pages/admin/products/product-list').then(m => m.ProductList),
      },
      {
        path: 'products/new',
        loadComponent: () => import('./pages/admin/products/product-form').then(m => m.ProductForm),
      },
      {
        path: 'products/:id/edit',
        loadComponent: () => import('./pages/admin/products/product-form').then(m => m.ProductForm),
      },
      {
        path: 'products/:id/delete',
        loadComponent: () => import('./pages/admin/products/product-delete').then(m => m.ProductDelete),
      },

      // Categorii
      {
        path: 'categories',
        loadComponent: () => import('./pages/admin/categories/category-list').then(m => m.CategoryList),
      },
      {
        path: 'categories/new',
        loadComponent: () => import('./pages/admin/categories/category-form').then(m => m.CategoryForm),
      },
      {
        path: 'categories/:id/edit',
        loadComponent: () => import('./pages/admin/categories/category-form').then(m => m.CategoryForm),
      },
      {
        path: 'categories/:id/delete',
        loadComponent: () => import('./pages/admin/categories/category-delete').then(m => m.CategoryDelete),
      },

      // Subcategorii
      {
        path: 'subcategories/new',
        loadComponent: () => import('./pages/admin/categories/subcategory-form').then(m => m.SubcategoryForm),
      },
      {
        path: 'subcategories/:id/edit',
        loadComponent: () => import('./pages/admin/categories/subcategory-form').then(m => m.SubcategoryForm),
      },
      {
        path: 'subcategories/:id/delete',
        loadComponent: () =>
          import('./pages/admin/categories/subcategory-delete').then(m => m.SubcategoryDelete),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
