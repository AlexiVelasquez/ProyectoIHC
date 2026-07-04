# Colegio Buenaventura — Control de Visitas

Sistema Angular 17 con API Node.js. No usa MySQL.

## Cómo guarda los datos

- En local guarda los registros en `server/data/visitas.json`.
- En Vercel guarda los registros en KV/Redis usando variables de entorno.
- Si subes a Vercel sin KV, funcionará solo de prueba, pero los nuevos registros
  podrían perderse cuando Vercel reinicie la función.

Los registros que estaban en MySQL fueron migrados como respaldo inicial a:

```text
server/data/visitas.json
```

## Ejecución local

Ejecuta un solo comando dentro de esta carpeta:

```bash
npm start
```

La web estará disponible en:

```text
http://localhost:4200
```

La API local responde en:

```text
http://localhost:3000/api/health
```

## Deploy público en Vercel

En Vercel ya no se usa la IP `192.168...`. El QR usará automáticamente la URL
pública del proyecto, por ejemplo:

```text
https://tu-proyecto.vercel.app/registro?modo=visitante
```

## Variables para Vercel

Para que los registros no se pierdan, crea un KV/Redis en Vercel Marketplace o
en Upstash y agrega estas variables en:

`Vercel > Project Settings > Environment Variables`

```env
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

También se aceptan:

```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## Build

```bash
npm run build
```

Vercel usará:

- Build command: `npm run build`
- Output directory: `dist/colegio-buenaventura/browser`
- API serverless: carpeta `api/`

## Probar después de publicar

Abre:

```text
https://tu-proyecto.vercel.app/api/health
```

Debe responder algo similar a:

```json
{
  "status": "ok",
  "storage": "vercel-kv",
  "total": 8
}
```

Luego prueba el formulario público:

```text
https://tu-proyecto.vercel.app/registro?modo=visitante
```
