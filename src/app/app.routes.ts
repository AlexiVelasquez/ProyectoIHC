import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home.component').then(m => m.HomeComponent),
    title: 'Inicio - Colegio Buenaventura'
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./components/registro-visita/registro-visita.component').then(m => m.RegistroVisitaComponent),
    title: 'Registrar Visita'
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('./components/historial-visitas/historial-visitas.component').then(m => m.HistorialVisitasComponent),
    title: 'Historial de Visitas'
  },
  {
    path: 'buscar',
    loadComponent: () =>
      import('./components/buscar-visita/buscar-visita.component').then(m => m.BuscarVisitaComponent),
    title: 'Buscar Visita'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
