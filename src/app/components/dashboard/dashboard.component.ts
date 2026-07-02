import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VisitasService } from '../../services/visitas.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  
  visitasHoy: number = 0;
  visitasActivas: number = 3;
  totalHistorico: number = 0;
  
  chart: any;
  private intervaloId: any;

  constructor(
    private router: Router,
    private visitasService: VisitasService
  ) {}

  ngOnInit(): void {
    this.calcularMetricasIniciales();
    this.inicializarGrafico();

    // Desglose Cronométrico de la Actividad: Simulación en vivo cada 3 segundos
    this.intervaloId = setInterval(() => {
      // Simular que el flujo de personas dentro de la institución fluctúa en tiempo real
      this.visitasActivas = Math.floor(Math.random() * 6) + 2; 
      
      // Si entra un visitante simulado aleatorio, incrementamos el contador diario
      if (Math.random() > 0.6) {
        this.visitasHoy++;
      }

      // Sincronizar el último punto de la gráfica viva de Chart.js
      if (this.chart) {
        this.chart.data.datasets[0].data[4] = this.visitasActivas;
        this.chart.update();
      }
    }, 3000);
  }

  private calcularMetricasIniciales(): void {
    const listado = this.visitasService.getVisitas();
    this.totalHistorico = listado.length;

    const hoy = new Date().toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    
    this.visitasHoy = listado.filter(v => v.fecha === hoy).length;
    // Si no hay visitas registradas hoy aún, inicializamos con una base para demostración
    if (this.visitasHoy === 0) this.visitasHoy = 12; 
  }

  inicializarGrafico(): void {
    this.chart = new Chart('canvasVisitas', {
      type: 'bar',
      data: {
        labels: ['08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', 'En vivo ⏱️'],
        datasets: [{
          label: 'Visitantes simultáneos',
          data: [6, 14, 19, 9, this.visitasActivas],
          backgroundColor: '#4B5EFC', 
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  volverAlInicio(): void {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.intervaloId) {
      clearInterval(this.intervaloId);
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }
}