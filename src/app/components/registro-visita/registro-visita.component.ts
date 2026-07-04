import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VisitasService } from '../../services/visitas.service';

@Component({
  selector: 'app-registro-visita',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-visita.component.html',
  styleUrls: ['./registro-visita.component.css']
})
export class RegistroVisitaComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  loading = false;
  success = false;
  errorMsg = '';
  modoVisitante = false;

  motivos = [
    'Reunión de padres', 'Trámite administrativo', 'Entrega de documentos',
    'Visita a estudiante', 'Reunión con docente', 'Servicio técnico',
    'Inspección o auditoría', 'Otro'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private visitasService: VisitasService
  ) {}

  ngOnInit(): void {
    const host = window.location.hostname;
    this.modoVisitante = this.route.snapshot.queryParamMap.get('modo') === 'visitante'
      || (host !== 'localhost' && host !== '127.0.0.1');
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.pattern(soloLetras)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.pattern(soloLetras)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      telefono: ['', [Validators.pattern(/^9\d{8}$/)]],
      correo: ['', [Validators.email, Validators.maxLength(150)]],
      motivoVisita: ['', Validators.required],
      descripcion: ['', Validators.maxLength(1000)]
    });
  }

  get f() { return this.form.controls; }

  isError(field: string): boolean {
    return this.submitted && !!this.f[field].errors;
  }

  isValid(field: string): boolean {
    return !this.f[field].errors && (this.f[field].dirty || this.submitted);
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMsg = '';
    if (this.form.invalid) {
      document.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    this.loading = true;
    this.visitasService.agregarVisita({
      nombre: this.f['nombre'].value.trim(),
      apellidos: this.f['apellidos'].value.trim(),
      dni: this.f['dni'].value.trim(),
      telefono: this.f['telefono'].value?.trim() || '',
      correo: this.f['correo'].value?.trim().toLowerCase() || '',
      motivoVisita: this.f['motivoVisita'].value,
      descripcion: this.f['descripcion'].value?.trim() || ''
    }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        if (!this.modoVisitante) {
          setTimeout(() => this.router.navigate(['/']), 2500);
        }
      },
      error: error => {
        this.loading = false;
        this.errorMsg = error?.error?.message || 'No se pudo guardar la visita. Verifique la conexión con la base de datos.';
      }
    });
  }

  volver(): void {
    if (!this.modoVisitante) this.router.navigate(['/']);
  }

  get charCount(): number {
    return this.f['descripcion'].value?.length ?? 0;
  }
}
