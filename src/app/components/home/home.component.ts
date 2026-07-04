import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';
import { VisitasService } from '../../services/visitas.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, QRCodeModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  qrUrl = '';
  hora = '';
  fecha = '';
  totalHoy = 0;
  totalVisitas = 0;
  serviceOnline = true;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    private visitasService: VisitasService
  ) {}

  ngOnInit(): void {
    const { protocol, hostname, port } = window.location;
    this.qrUrl = `${protocol}//${hostname}${port ? ':' + port : ''}/registro?modo=visitante`;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      this.visitasService.getNetworkInfo().subscribe({
        next: info => this.qrUrl = info.registrationUrl
      });
    }

    this.actualizarHora();
    this.timer = setInterval(() => this.actualizarHora(), 1000);

    const hoy = new Date().toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    this.visitasService.getVisitas().subscribe({
      next: visitas => {
        this.totalVisitas = visitas.length;
        this.totalHoy = visitas.filter(v => v.fecha === hoy).length;
        this.serviceOnline = true;
      },
      error: () => this.serviceOnline = false
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  ir(ruta: string): void {
    this.router.navigate([ruta]);
  }

  private actualizarHora(): void {
    const now = new Date();
    this.hora = now.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    this.fecha = now.toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
