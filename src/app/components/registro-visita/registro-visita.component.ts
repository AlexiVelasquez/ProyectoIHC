import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  submitted  = false;
  loading    = false;
  success    = false;
  errorMsg   = '';

  motivos = [
    'Reunión de padres',
    'Trámite administrativo',
    'Entrega de documentos',
    'Visita a estudiante',
    'Reunión con docente',
    'Servicio técnico',
    'Inspección o auditoría',
    'Otro'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private visitasService: VisitasService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre:       ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      apellidos:    ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      dni:          ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      motivoVisita: ['', Validators.required],
      descripcion:  ['', Validators.maxLength(1000)]
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
    this.errorMsg  = '';

    if (this.form.invalid) {
      // Scroll to first error
      const el = document.querySelector('.field-error');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    this.loading = true;

    // Simulamos un pequeño delay para UX
    setTimeout(() => {
      const ok = this.visitasService.agregarVisita({
        nombre:       this.f['nombre'].value.trim(),
        apellidos:    this.f['apellidos'].value.trim(),
        dni:          this.f['dni'].value.trim(),
        motivoVisita: this.f['motivoVisita'].value,
        descripcion:  this.f['descripcion'].value?.trim() || ''
      });

      this.loading = false;

      if (ok) {
        this.success = true;
        setTimeout(() => this.router.navigate(['/']), 2500);
      } else {
        this.errorMsg = 'Ocurrió un error al guardar. Por favor, intente nuevamente.';
      }
    }, 700);
  }

  volver(): void {
    this.router.navigate(['/']);
  }

  get charCount(): number {
    return this.f['descripcion'].value?.length ?? 0;
  }
}
