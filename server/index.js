const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const mysql = require('mysql2/promise');

function loadEnv() {
  const file = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}

loadEnv();

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'colegio_buenaventura'
};
const apiPort = Number(process.env.API_PORT || 3000);
let pool;

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

const selectColumns = `SELECT CAST(v.id_visita AS CHAR) AS id,
  vi.nombres AS nombre, vi.apellidos, vi.numero_documento AS dni,
  COALESCE(vi.telefono, '') AS telefono, COALESCE(vi.correo, '') AS correo,
  m.nombre AS motivoVisita, COALESCE(v.descripcion, '') AS descripcion,
  DATE_FORMAT(v.fecha_visita, '%d/%m/%Y') AS fecha,
  TIME_FORMAT(v.hora_entrada, '%H:%i') AS hora
  FROM visitas v
  INNER JOIN visitantes vi ON vi.id_visitante = v.id_visitante
  INNER JOIN motivos_visita m ON m.id_motivo = v.id_motivo`;

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: config.host, port: config.port, user: config.user, password: config.password
  });
  const database = config.database.replace(/[^a-zA-Z0-9_]/g, '');
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.end();
  pool = mysql.createPool({ ...config, database, waitForConnections: true, connectionLimit: 10 });
  const [requiredTables] = await pool.query(
    "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = ? AND table_name IN ('visitas', 'visitantes', 'motivos_visita', 'usuarios')",
    [database]
  );
  if (Number(requiredTables[0].total) !== 4) {
    throw new Error('La base no contiene las tablas requeridas: visitas, visitantes, motivos_visita y usuarios');
  }
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

function validateVisit(body) {
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

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/api/health') {
      await pool.query('SELECT 1');
      return json(res, 200, { status: 'ok', database: config.database });
    }
    if (req.method === 'GET' && url.pathname === '/api/network-info') {
      const lanIp = getLanIp();
      return json(res, 200, {
        lanIp,
        registrationUrl: `http://${lanIp}:4200/registro?modo=visitante`
      });
    }
    if (req.method === 'GET' && url.pathname === '/api/visitas') {
      const filters = [
        ['vi.numero_documento', url.searchParams.get('dni')],
        ['vi.nombres', url.searchParams.get('nombre')],
        ['vi.apellidos', url.searchParams.get('apellido')]
      ];
      const where = [];
      const values = [];
      for (const [column, value] of filters) {
        if (value?.trim()) { where.push(`${column} LIKE ?`); values.push(`%${value.trim()}%`); }
      }
      const clause = where.length ? ` WHERE ${where.join(' AND ')}` : '';
      const [rows] = await pool.execute(`${selectColumns}${clause} ORDER BY v.fecha_visita DESC, v.hora_entrada DESC, v.id_visita DESC`, values);
      return json(res, 200, rows);
    }
    if (req.method === 'POST' && url.pathname === '/api/visitas') {
      const [error, visit] = validateVisit(await readBody(req));
      if (error) return json(res, 400, { message: error });
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [existingVisitors] = await connection.execute(
          'SELECT id_visitante FROM visitantes WHERE numero_documento = ? LIMIT 1', [visit.dni]
        );
        let visitorId;
        if (existingVisitors.length) {
          visitorId = existingVisitors[0].id_visitante;
          await connection.execute(
            `UPDATE visitantes SET nombres = ?, apellidos = ?,
             telefono = NULLIF(?, ''), correo = NULLIF(?, '') WHERE id_visitante = ?`,
            [visit.nombre, visit.apellidos, visit.telefono, visit.correo, visitorId]
          );
        } else {
          const [visitorResult] = await connection.execute(
            `INSERT INTO visitantes
             (id_tipo_documento, numero_documento, nombres, apellidos, telefono, correo)
             VALUES (1, ?, ?, ?, NULLIF(?, ''), NULLIF(?, ''))`,
            [visit.dni, visit.nombre, visit.apellidos, visit.telefono, visit.correo]
          );
          visitorId = visitorResult.insertId;
        }

        let [motives] = await connection.execute(
          'SELECT id_motivo FROM motivos_visita WHERE nombre = ? AND estado = 1 LIMIT 1', [visit.motivoVisita]
        );
        if (!motives.length) {
          [motives] = await connection.execute(
            "SELECT id_motivo FROM motivos_visita WHERE nombre = 'Otro' AND estado = 1 LIMIT 1"
          );
        }
        const [users] = await connection.execute(
          "SELECT id_usuario FROM usuarios WHERE estado = 'ACTIVO' ORDER BY id_usuario LIMIT 1"
        );
        if (!motives.length || !users.length) throw new Error('No existe un motivo o usuario activo para registrar la visita');

        const [result] = await connection.execute(
          `INSERT INTO visitas
           (id_visitante, id_motivo, id_usuario_registra, fecha_visita, hora_entrada, descripcion, estado)
           VALUES (?, ?, ?, CURDATE(), CURTIME(), ?, 'REGISTRADA')`,
          [visitorId, motives[0].id_motivo, users[0].id_usuario, visit.descripcion]
        );
        await connection.commit();
        const [rows] = await pool.execute(`${selectColumns} WHERE v.id_visita = ?`, [result.insertId]);
        return json(res, 201, rows[0]);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }
    return json(res, 404, { message: 'Ruta no encontrada' });
  } catch (error) {
    console.error(error);
    const status = error instanceof SyntaxError ? 400 : 500;
    return json(res, status, { message: status === 400 ? 'JSON inválido' : 'No se pudo completar la operación' });
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

initializeDatabase()
  .then(() => server.listen(apiPort, () => {
    console.log(`API disponible en http://localhost:${apiPort}`);
    console.log(`MySQL: ${config.host}:${config.port}/${config.database}`);
  }))
  .catch(error => {
    console.error('No se pudo conectar con MySQL:', error.message);
    process.exit(1);
  });
