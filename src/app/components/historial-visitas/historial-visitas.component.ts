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

  visitas: Visita[]         = [];
  filtradas: Visita[]       = [];
  searchTerm                = '';
  sortColumn: keyof Visita  = 'fecha';
  sortAsc                   = false;

  constructor(
    private router: Router,
    private visitasService: VisitasService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.visitas  = [...this.visitasService.getVisitas()].reverse();
    this.filtradas = this.visitas;
  }

  filtrar(): void {
    const t = this.searchTerm.toLowerCase().trim();
    this.filtradas = this.visitas.filter(v =>
      v.nombre.toLowerCase().includes(t) ||
      v.apellidos.toLowerCase().includes(t) ||
      v.dni.includes(t) ||
      v.motivoVisita.toLowerCase().includes(t)
    );
  }

  ordenar(col: keyof Visita): void {
    if (this.sortColumn === col) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = col;
      this.sortAsc = true;
    }
    this.filtradas = [...this.filtradas].sort((a, b) => {
      const va = (a[col] ?? '').toString().toLowerCase();
      const vb = (b[col] ?? '').toString().toLowerCase();
      return this.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }

  get totalHoy(): number {
    const hoy = new Date().toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    return this.visitas.filter(v => v.fecha === hoy).length;
  }

  ir(ruta: string): void { this.router.navigate([ruta]); }
}
