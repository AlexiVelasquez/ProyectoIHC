import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitasService } from '../../services/visitas.service';
import { Visita } from '../../models/visita.model';

@Component({
  selector: 'app-buscar-visita',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscar-visita.component.html',
  styleUrls: ['./buscar-visita.component.css']
})
export class BuscarVisitaComponent {
  filtros = { dni: '', nombre: '', apellido: '' };
  resultados: Visita[] = [];
  buscado = false;
  loading = false;
  errorMsg = '';

  constructor(private router: Router, private visitasService: VisitasService) {}

  buscar(): void {
    const { dni, nombre, apellido } = this.filtros;
    if (!dni.trim() && !nombre.trim() && !apellido.trim()) return;
    this.loading = true;
    this.buscado = false;
    this.errorMsg = '';
    this.visitasService.buscarVisitas(dni, nombre, apellido).subscribe({
      next: resultados => {
        this.resultados = resultados;
        this.buscado = true;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.buscado = true;
        this.errorMsg = 'No se pudo realizar la búsqueda. Verifique la conexión con MySQL.';
      }
    });
  }

  limpiar(): void {
    this.filtros = { dni: '', nombre: '', apellido: '' };
    this.resultados = [];
    this.buscado = false;
    this.errorMsg = '';
  }

  ir(ruta: string): void { this.router.navigate([ruta]); }

  get hayFiltros(): boolean {
    return !!(this.filtros.dni || this.filtros.nombre || this.filtros.apellido);
  }
}
