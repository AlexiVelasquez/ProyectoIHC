# 🏫 Colegio Buenaventura — Sistema de Control de Visitas

Sistema web Angular 17 para registrar y consultar visitas al colegio,
con generación de **QR dinámico** para acceso desde celular en la misma red.

---

## 📁 Estructura del Proyecto

```
colegio-buenaventura/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── home/                    ← Pantalla principal + QR
│   │   │   ├── registro-visita/         ← Formulario de registro
│   │   │   ├── historial-visitas/       ← Tabla con todos los registros
│   │   │   └── buscar-visita/           ← Búsqueda por DNI / nombre
│   │   ├── models/
│   │   │   └── visita.model.ts          ← Interface Visita
│   │   ├── services/
│   │   │   └── visitas.service.ts       ← CRUD con localStorage
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts               ← Rutas lazy-loaded
│   ├── index.html
│   ├── main.ts
│   └── styles.css                      ← Variables CSS globales
├── angular.json
├── package.json
├── tsconfig.json
└── tsconfig.app.json
```

---

## 🚀 Instalación y Ejecución

### Requisitos previos
- **Node.js** ≥ 18  →  https://nodejs.org
- **npm** ≥ 9 (viene con Node.js)

### 1 — Abrir en VS Code
```bash
# Abrir la carpeta del proyecto
code colegio-buenaventura
```
O en VS Code: `Archivo → Abrir Carpeta…` y selecciona la carpeta.

### 2 — Instalar dependencias
Abre la terminal integrada de VS Code (`Ctrl + ñ` / `Ctrl + \``) y ejecuta:
```bash
npm install
```
> Esto instala Angular 17, angularx-qrcode y todas las dependencias.

### 3 — Iniciar servidor de desarrollo
```bash
npm start
```
La aplicación estará disponible en:
```
http://localhost:4200
```

---

## 📱 Cómo funciona el QR

El QR se genera **dinámicamente** con la URL real del servidor:

- Si accedes desde `localhost:4200` → el QR apunta a `http://localhost:4200/registro`
- Si quieres que funcione desde el celular (misma red Wi-Fi), usa:

```bash
npm run start:network
```

Esto levanta el servidor en `0.0.0.0:4200`. Luego averigua tu IP local:

**Windows:**
```bash
ipconfig
# Busca "Dirección IPv4" → ej: 192.168.1.15
```

**macOS / Linux:**
```bash
ip a   # o   ifconfig
# Busca inet en la interfaz Wi-Fi → ej: 192.168.1.15
```

Luego accede desde cualquier dispositivo en la misma red a:
```
http://192.168.1.15:4200
```
El QR en pantalla apuntará automáticamente a esa dirección.

---

## 🗺️ Rutas disponibles

| Ruta         | Componente           | Descripción                        |
|-------------|----------------------|------------------------------------|
| `/`          | HomeComponent        | Pantalla principal + QR de acceso  |
| `/registro`  | RegistroVisitaComponent | Formulario para registrar visita |
| `/historial` | HistorialVisitasComponent | Tabla de todas las visitas     |
| `/buscar`    | BuscarVisitaComponent | Búsqueda por DNI, nombre, apellido |

---

## 💾 Almacenamiento

Los datos se guardan en el **localStorage** del navegador bajo la clave
`visitas_buenaventura`. No requiere backend ni base de datos.

> Para ver los datos almacenados en el navegador:
> DevTools (`F12`) → Application → Local Storage → `http://localhost:4200`

---

## 🔧 Extensiones útiles para VS Code

Instala estas extensiones para una mejor experiencia:
- **Angular Language Service** (id: `angular.ng-template`)
- **ESLint** (id: `dbaeumer.vscode-eslint`)
- **Prettier** (id: `esbenp.prettier-vscode`)

---

## 🎨 Paleta de colores

| Variable          | Hex       | Uso                     |
|------------------|-----------|-------------------------|
| `--primary`       | `#4B5EFC` | Botones y acentos       |
| `--accent`        | `#F5A623` | Badges y estadísticas   |
| `--accent-green`  | `#00C896` | Éxito / confirmación    |
| `--accent-red`    | `#FF4C6A` | Errores                 |
| `--bg`            | `#0F0F1A` | Fondo base              |
| `--bg-card`       | `#17172A` | Tarjetas                |
