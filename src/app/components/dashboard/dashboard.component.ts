import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { VisitasService } from '../../services/visitas.service';
import { Visita } from '../../models/visita.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  visitasHoy = 0;
  visitasActivas = 0;
  totalHistorico = 0;
  ultimaActualizacion = '';
  loading = true;

  private chart: Chart | null = null;
  private intervaloId: ReturnType<typeof setInterval> | null = null;
  private readonly bloques = ['08:00', '10:00', '12:00', '14:00', '16:00'];

  constructor(
    private router: Router,
    private visitasService: VisitasService
  ) {}

  ngOnInit(): void {
    this.cargarMetricas();
    this.intervaloId = setInterval(() => this.cargarMetricas(true), 3000);
  }

  ngOnDestroy(): void {
    if (this.intervaloId) clearInterval(this.intervaloId);
    if (this.chart) this.chart.destroy();
  }

  volverAlInicio(): void {
    this.router.navigate(['/']);
  }

  private cargarMetricas(silencioso = false): void {
    if (!silencioso) this.loading = true;

    this.visitasService.getVisitas().subscribe({
      next: visitas => {
        const hoy = new Date().toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const visitasDelDia = visitas.filter(v => v.fecha === hoy);

        this.totalHistorico = visitas.length;
        this.visitasHoy = visitasDelDia.length;
        this.visitasActivas = this.calcularActividadReciente(visitasDelDia);
        this.ultimaActualizacion = new Date().toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        this.actualizarGrafico(visitasDelDia);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private calcularActividadReciente(visitas: Visita[]): number {
    const ahora = new Date();
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

    return visitas.filter(v => {
      const [hora = '0', minuto = '0'] = String(v.hora || '').split(':');
      const minutosVisita = Number(hora) * 60 + Number(minuto);
      return minutosActuales - minutosVisita >= 0 && minutosActuales - minutosVisita <= 60;
    }).length;
  }

  private datosPorBloque(visitas: Visita[]): number[] {
    return this.bloques.map(bloque => {
      const horaBase = Number(bloque.split(':')[0]);
      return visitas.filter(v => {
        const hora = Number(String(v.hora || '0').split(':')[0]);
        return hora >= horaBase && hora < horaBase + 2;
      }).length;
    });
  }

  private actualizarGrafico(visitasDelDia: Visita[]): void {
    const data = this.datosPorBloque(visitasDelDia);
    const labels = [...this.bloques.map(h => `${h} - ${Number(h.split(':')[0]) + 2}:00`), 'Última hora'];
    const values = [...data, this.visitasActivas];

    if (!this.chart) {
      this.crearGrafico(labels, values);
      return;
    }

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = values;
    this.chart.update();
  }

  private crearGrafico(labels: string[], values: number[]): void {
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Visitantes registrados',
          data: values,
          backgroundColor: [
            'rgba(75, 94, 252, 0.82)',
            'rgba(0, 200, 150, 0.82)',
            'rgba(123, 79, 255, 0.82)',
            'rgba(245, 166, 35, 0.82)',
            'rgba(75, 138, 255, 0.82)',
            'rgba(0, 220, 180, 0.9)'
          ],
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#15152A',
            borderColor: 'rgba(123, 138, 254, 0.35)',
            borderWidth: 1,
            titleColor: '#F4F4FF',
            bodyColor: '#B9B8D3'
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#8F9BB3' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#8F9BB3', precision: 0 },
            grid: { color: 'rgba(255,255,255,0.07)' }
          }
        }
      }
    };

    this.chart = new Chart('canvasVisitas', config);
  }
}
