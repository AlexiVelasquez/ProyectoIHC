const fs = require('node:fs/promises');
const path = require('node:path');

const STORAGE_KEY = process.env.STORAGE_KEY || 'colegio:buenaventura:visitas';
const DATA_FILE = path.join(__dirname, '..', '..', 'server', 'data', 'visitas.json');
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let memoryVisits;

function hasKv() {
  return Boolean(KV_URL && KV_TOKEN);
}

async function kvCommand(command, ...args) {
  const response = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([command, ...args])
  });

  if (!response.ok) {
    throw new Error(`KV respondió ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.result;
}

async function readSeedVisits() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function readVisits() {
  if (hasKv()) {
    const stored = await kvCommand('GET', STORAGE_KEY);
    if (stored) return JSON.parse(stored);

    const seed = await readSeedVisits();
    await writeVisits(seed);
    return seed;
  }

  if (process.env.VERCEL) {
    if (!memoryVisits) memoryVisits = await readSeedVisits();
    return memoryVisits;
  }

  return readSeedVisits();
}

async function writeVisits(visits) {
  const ordered = orderVisits(visits);

  if (hasKv()) {
    await kvCommand('SET', STORAGE_KEY, JSON.stringify(ordered));
    return ordered;
  }

  if (process.env.VERCEL) {
    memoryVisits = ordered;
    return ordered;
  }

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
  return ordered;
}

function orderVisits(visits) {
  return [...visits].sort((a, b) => {
    const dateA = parseVisitDate(a);
    const dateB = parseVisitDate(b);
    if (dateA !== dateB) return dateB - dateA;
    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function parseVisitDate(visit) {
  const [day = '1', month = '1', year = '1970'] = String(visit.fecha || '').split('/');
  const [hour = '0', minute = '0'] = String(visit.hora || '').split(':');
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}

function filterVisits(visits, query = {}) {
  const dni = normalize(query.dni);
  const nombre = normalize(query.nombre);
  const apellido = normalize(query.apellido);

  return visits.filter(visit => {
    if (dni && !normalize(visit.dni).includes(dni)) return false;
    if (nombre && !normalize(visit.nombre).includes(nombre)) return false;
    if (apellido && !normalize(visit.apellidos).includes(apellido)) return false;
    return true;
  });
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function createVisitPayload(body = {}) {
  const [error, visit] = validateVisit(body);
  if (error) return [error];

  const now = new Date();
  const fecha = now.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Lima'
  });
  const hora = now.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Lima'
  });

  return [null, {
    ...visit,
    fecha,
    hora
  }];
}

function validateVisit(body = {}) {
  const visit = {
    nombre: String(body.nombre || '').trim(),
    apellidos: String(body.apellidos || '').trim(),
    dni: String(body.dni || '').trim(),
    telefono: String(body.telefono || '').trim(),
    correo: String(body.correo || '').trim().toLowerCase(),
    motivoVisita: String(body.motivoVisita || '').trim(),
    descripcion: String(body.descripcion || '').trim()
  };

  if (visit.nombre.length < 2 || visit.nombre.length > 100) return ['El nombre no es válido'];
  if (visit.apellidos.length < 2 || visit.apellidos.length > 150) return ['Los apellidos no son válidos'];
  if (!/^\d{8}$/.test(visit.dni)) return ['El DNI debe tener 8 dígitos'];
  if (visit.telefono && !/^9\d{8}$/.test(visit.telefono)) return ['El teléfono debe tener 9 dígitos y comenzar con 9'];
  if (visit.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visit.correo)) return ['El correo electrónico no es válido'];
  if (visit.correo.length > 150) return ['El correo electrónico es demasiado largo'];
  if (!visit.motivoVisita || visit.motivoVisita.length > 150) return ['El motivo de visita no es válido'];
  if (visit.descripcion.length > 1000) return ['La descripción supera los 1000 caracteres'];
  return [null, visit];
}

function allowCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

function sendError(res, error) {
  console.error(error);
  res.status(500).json({ message: 'No se pudo completar la operación' });
}

module.exports = {
  allowCors,
  createVisitPayload,
  filterVisits,
  hasKv,
  readVisits,
  sendError,
  writeVisits
};
