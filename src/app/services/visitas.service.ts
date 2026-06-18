import { Injectable } from '@angular/core';
import { Visita } from '../models/visita.model';

@Injectable({ providedIn: 'root' })
export class VisitasService {

  private readonly KEY = 'visitas_buenaventura';

  // ─── Leer todas las visitas ─────────────────────────────────────
  getVisitas(): Visita[] {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) {
        // Datos de muestra para la primera vez
        const muestra = this.semilla();
        localStorage.setItem(this.KEY, JSON.stringify(muestra));
        return muestra;
      }
      return JSON.parse(raw) as Visita[];
    } catch {
      return [];
    }
  }

  // ─── Agregar nueva visita ────────────────────────────────────────
  agregarVisita(datos: Omit<Visita, 'id' | 'fecha' | 'hora'>): boolean {
    try {
      const lista = this.getVisitas();
      const now = new Date();
      const nueva: Visita = {
        ...datos,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fecha: now.toLocaleDateString('es-PE', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        }),
        hora: now.toLocaleTimeString('es-PE', {
          hour: '2-digit', minute: '2-digit'
        })
      };
      lista.push(nueva);
      localStorage.setItem(this.KEY, JSON.stringify(lista));
      return true;
    } catch {
      return false;
    }
  }

  // ─── Buscar visitas con filtros ──────────────────────────────────
  buscarVisitas(dni = '', nombre = '', apellido = ''): Visita[] {
    const lista = this.getVisitas();
    const d = dni.trim().toLowerCase();
    const n = nombre.trim().toLowerCase();
    const a = apellido.trim().toLowerCase();

    if (!d && !n && !a) return lista;

    return lista.filter(v =>
      (!d || v.dni.toLowerCase().includes(d)) &&
      (!n || v.nombre.toLowerCase().includes(n)) &&
      (!a || v.apellidos.toLowerCase().includes(a))
    );
  }

  // ─── Datos de muestra ────────────────────────────────────────────
  private semilla(): Visita[] {
    return [
      { id: 'seed1', nombre: 'Ana Paula',     apellidos: 'Benavidez Rojas',  dni: '76457893', motivoVisita: 'Reunión de padres',       descripcion: '',       fecha: '21/04/2025', hora: '08:30' },
      { id: 'seed2', nombre: 'Roberto Aníbal',apellidos: 'Peña Lozano',      dni: '78493677', motivoVisita: 'Trámite administrativo', descripcion: '',       fecha: '21/04/2025', hora: '09:15' },
      { id: 'seed3', nombre: 'María Luz',     apellidos: 'Pérez Rodríguez',  dni: '73568902', motivoVisita: 'Entrega de documentos',   descripcion: '',       fecha: '21/04/2025', hora: '10:00' },
      { id: 'seed4', nombre: 'Antonio Luis',  apellidos: 'Ruiz Martínez',    dni: '74569378', motivoVisita: 'Visita a estudiante',    descripcion: '',       fecha: '21/04/2025', hora: '10:45' },
      { id: 'seed5', nombre: 'Ariana Amira',  apellidos: 'Navarro Castro',   dni: '73490356', motivoVisita: 'Reunión con docente',    descripcion: '',       fecha: '20/04/2025', hora: '11:00' },
    ];
  }
}
