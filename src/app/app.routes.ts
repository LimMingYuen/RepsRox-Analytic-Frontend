import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  {
    path: 'overview',
    title: 'Overview · RepsRox Analytics',
    loadComponent: () => import('./pages/overview'),
  },
  {
    path: 'training',
    title: 'Training · RepsRox Analytics',
    loadComponent: () => import('./pages/training'),
  },
  {
    path: 'nutrition',
    title: 'Fuel · RepsRox Analytics',
    loadComponent: () => import('./pages/nutrition'),
  },
  {
    path: 'races',
    title: 'Race sims · RepsRox Analytics',
    loadComponent: () => import('./pages/races'),
  },
  {
    path: 'weight',
    title: 'Body · RepsRox Analytics',
    loadComponent: () => import('./pages/weight'),
  },
  {
    path: 'import',
    title: 'Import · RepsRox Analytics',
    loadComponent: () => import('./pages/import'),
  },
  { path: '**', redirectTo: 'overview' },
];
