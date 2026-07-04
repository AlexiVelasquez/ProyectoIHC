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
  sortColumn: keyof Visita = 'fecha';
  sortAsc = false;
  loading = true;
  errorMsg = '';

  constructor(private router: Router, private visitasService: VisitasService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true;
    this.errorMsg = '';
    this.visitasService.getVisitas().subscribe({
      next: visitas => {
        this.visitas = visitas;
        this.filtradas = visitas;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'No se pudo cargar el historial. Verifique que la API y MySQL estén activos.';
      }
    });
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filtradas = this.visitas.filter(v =>
      v.nombre.toLowerCase().includes(term) || v.apellidos.toLowerCase().includes(term) ||
      v.dni.includes(term) || v.motivoVisita.toLowerCase().includes(term)
    );
  }

  ordenar(col: keyof Visita): void {
    if (this.sortColumn === col) this.sortAsc = !this.sortAsc;
    else { this.sortColumn = col; this.sortAsc = true; }
    this.filtradas = [...this.filtradas].sort((a, b) => {
      const first = (a[col] ?? '').toString().toLowerCase();
      const second = (b[col] ?? '').toString().toLowerCase();
      return this.sortAsc ? first.localeCompare(second) : second.localeCompare(first);
    });
  }

  get totalHoy(): number {
    const hoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return this.visitas.filter(v => v.fecha === hoy).length;
  }

  ir(ruta: string): void { this.router.navigate([ruta]); }
}
