import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitasService } from '../../services/visitas.service';
import { Visita } from '../../models/visita.model';

@Component({
  selector: 'app-historial-visitas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-visitas.component.html',
  styleUrls: ['./historial-visitas.component.css']
})
export class HistorialVisitasComponent implements OnInit {
  visitas: Visita[] = [];
  filtradas: Visita[] = [];
  searchTerm = '';
  fechaFiltro = '';
  motivoFiltro = '';
  sortColumn: keyof Visita = 'fecha';
  sortAsc = false;
  loading = true;
  errorMsg = '';

  motivosBase = [
    'Reunión de padres',
    'Trámite administrativo',
    'Entrega de documentos',
    'Visita a estudiante',
    'Reunión con docente',
    'Servicio técnico',
    'Inspección o auditoría',
    'Otro'
  ];

  constructor(private router: Router, private visitasService: VisitasService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.errorMsg = '';
    this.visitasService.getVisitas().subscribe({
      next: visitas => {
        this.visitas = visitas;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'No se pudo cargar el historial. Verifique que la API esté activa.';
      }
    });
  }

  filtrar(): void {
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const fecha = this.fechaFiltro ? this.formatearFechaInput(this.fechaFiltro) : '';
    const motivo = this.motivoFiltro.toLowerCase().trim();

    this.filtradas = this.visitas.filter(v => {
      const coincideTexto = !term ||
        v.nombre.toLowerCase().includes(term) ||
        v.apellidos.toLowerCase().includes(term) ||
        v.dni.includes(term) ||
        v.motivoVisita.toLowerCase().includes(term);

      const coincideFecha = !fecha || v.fecha === fecha;
      const coincideMotivo = !motivo || v.motivoVisita.toLowerCase() === motivo;

      return coincideTexto && coincideFecha && coincideMotivo;
    });

    this.aplicarOrdenActual();
  }

  ordenar(col: keyof Visita): void {
    if (this.sortColumn === col) this.sortAsc = !this.sortAsc;
    else {
      this.sortColumn = col;
      this.sortAsc = true;
    }
    this.aplicarOrdenActual();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.fechaFiltro = '';
    this.motivoFiltro = '';
    this.aplicarFiltros();
  }

  get motivosDisponibles(): string[] {
    return Array.from(new Set([
      ...this.motivosBase,
      ...this.visitas.map(v => v.motivoVisita).filter(Boolean)
    ])).sort((a, b) => a.localeCompare(b, 'es'));
  }

  get hayFiltrosActivos(): boolean {
    return Boolean(this.searchTerm || this.fechaFiltro || this.motivoFiltro);
  }

  get totalHoy(): number {
    const hoy = new Date().toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return this.visitas.filter(v => v.fecha === hoy).length;
  }

  ir(ruta: string): void {
    this.router.navigate([ruta]);
  }

  private aplicarOrdenActual(): void {
    this.filtradas = [...this.filtradas].sort((a, b) => {
      const first = this.valorOrdenable(a, this.sortColumn);
      const second = this.valorOrdenable(b, this.sortColumn);
      return this.sortAsc ? first.localeCompare(second) : second.localeCompare(first);
    });
  }

  private valorOrdenable(visita: Visita, col: keyof Visita): string {
    if (col === 'fecha') {
      const [day = '01', month = '01', year = '1970'] = String(visita.fecha || '').split('/');
      return `${year}-${month}-${day}`;
    }
    return (visita[col] ?? '').toString().toLowerCase();
  }

  private formatearFechaInput(value: string): string {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
}
