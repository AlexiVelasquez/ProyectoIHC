# Colegio Buenaventura — Control de Visitas

Sistema Angular 17 con API Node.js y persistencia en MySQL.

## Requisitos

- Node.js 18 o superior
- MySQL activo en el puerto configurado
- Base de datos `colegio_buenaventura` con las tablas existentes del colegio

## Configuración

La conexión se define en `.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=colegio_buenaventura
API_PORT=3000
```

El puerto se verificó contra la instalación local de MySQL. Si lo cambias en el
servidor, actualiza también `DB_PORT`.

## Ejecución

Ejecuta un solo comando dentro de esta carpeta:

```bash
npm start
```

Este comando inicia conjuntamente la API y Angular. La web estará disponible en
`http://localhost:4200` y la API responde en `http://localhost:3000/api/health`.
Angular también queda disponible en la red local y el QR usa automáticamente la
IP Wi-Fi del equipo. El celular debe estar conectado a la misma red.

Para ejecutar cada parte por separado también están disponibles `npm run api`
y `npm run web`.

Para abrir la web desde otros equipos de la misma red, usa `npm run start:network`.

## Datos

La API usa el modelo relacional existente: `visitantes`, `motivos_visita`,
`usuarios` y `visitas`. Ofrece registro transaccional, historial y búsqueda por
DNI, nombre o apellido.
