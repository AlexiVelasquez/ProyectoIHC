import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Visita } from '../models/visita.model';

@Injectable({ providedIn: 'root' })
export class VisitasService {
  private readonly apiUrl = '/api/visitas';

  constructor(private http: HttpClient) {}

  getNetworkInfo(): Observable<{ lanIp: string; registrationUrl: string }> {
    return this.http.get<{ lanIp: string; registrationUrl: string }>('/api/network-info');
  }

  getVisitas(): Observable<Visita[]> {
    return this.http.get<Visita[]>(this.apiUrl);
  }

  agregarVisita(datos: Omit<Visita, 'id' | 'fecha' | 'hora'>): Observable<Visita> {
    return this.http.post<Visita>(this.apiUrl, datos);
  }

  buscarVisitas(dni = '', nombre = '', apellido = ''): Observable<Visita[]> {
    let params = new HttpParams();
    if (dni.trim()) params = params.set('dni', dni.trim());
    if (nombre.trim()) params = params.set('nombre', nombre.trim());
    if (apellido.trim()) params = params.set('apellido', apellido.trim());
    return this.http.get<Visita[]>(this.apiUrl, { params });
  }
}
