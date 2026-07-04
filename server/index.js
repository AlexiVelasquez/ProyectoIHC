const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  createVisitPayload,
  filterVisits,
  readVisits,
  writeVisits
} = require('../api/_lib/storage');

function loadEnv() {
  const file = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}

loadEnv();

const apiPort = Number(process.env.API_PORT || 3000);

function getLanIp() {
  const ipv4 = Object.entries(os.networkInterfaces()).flatMap(([name, addresses]) =>
    (addresses || []).map(address => ({ ...address, name }))
  ).filter(address =>
    address.family === 'IPv4' && !address.internal && address.address !== '127.0.0.1'
  );
  const physical = ipv4.filter(address =>
    !/(virtual|vmware|vbox|host-only|loopback|docker|wsl)/i.test(address.name)
  );
  const preferred = physical.find(address => /wi-?fi|wlan|wireless/i.test(address.name))
    || physical.find(address => /ethernet|en\d|eth\d/i.test(address.name))
    || physical.find(address => /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address.address));
  return preferred?.address || ipv4[0]?.address || 'localhost';
}

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  res.end(status === 204 ? undefined : JSON.stringify(data));
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error('Payload demasiado grande');
  }
  return JSON.parse(body || '{}');
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/api/health') {
      const visits = await readVisits();
      return json(res, 200, { status: 'ok', storage: 'json', total: visits.length });
    }

    if (req.method === 'GET' && url.pathname === '/api/network-info') {
      const lanIp = getLanIp();
      return json(res, 200, {
        lanIp,
        registrationUrl: `http://${lanIp}:4200/registro?modo=visitante`
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/visitas') {
      const visits = await readVisits();
      return json(res, 200, filterVisits(visits, Object.fromEntries(url.searchParams.entries())));
    }

    if (req.method === 'POST' && url.pathname === '/api/visitas') {
      const [error, visit] = createVisitPayload(await readBody(req));
      if (error) return json(res, 400, { message: error });

      const visits = await readVisits();
      const nextId = Math.max(0, ...visits.map(item => Number(item.id) || 0)) + 1;
      const saved = { id: String(nextId), ...visit };

      await writeVisits([saved, ...visits]);
      return json(res, 201, saved);
    }

    return json(res, 404, { message: 'Ruta no encontrada' });
  } catch (error) {
    console.error(error);
    const status = error instanceof SyntaxError ? 400 : 500;
    return json(res, status, {
      message: status === 400 ? 'JSON inválido' : 'No se pudo completar la operación'
    });
  }
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${apiPort} ya está en uso. Cierre el proceso anterior o ejecute nuevamente npm start.`);
  } else {
    console.error('Error del servidor:', error.message);
  }
  process.exit(1);
});

server.listen(apiPort, () => {
  console.log(`API local disponible en http://localhost:${apiPort}`);
  console.log('Almacenamiento local: server/data/visitas.json');
});
