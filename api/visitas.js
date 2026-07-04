const {
  allowCors,
  createVisitPayload,
  filterVisits,
  readVisits,
  sendError,
  writeVisits
} = require('./_lib/storage');

module.exports = async function handler(req, res) {
  if (allowCors(req, res)) return;

  try {
    if (req.method === 'GET') return getVisits(req, res);
    if (req.method === 'POST') return createVisit(req, res);
    return res.status(405).json({ message: 'Método no permitido' });
  } catch (error) {
    return sendError(res, error);
  }
};

async function getVisits(req, res) {
  const visits = await readVisits();
  return res.status(200).json(filterVisits(visits, req.query));
}

async function createVisit(req, res) {
  const [error, visit] = createVisitPayload(parseBody(req.body));
  if (error) return res.status(400).json({ message: error });

  const visits = await readVisits();
  const nextId = Math.max(0, ...visits.map(item => Number(item.id) || 0)) + 1;
  const saved = { id: String(nextId), ...visit };

  await writeVisits([saved, ...visits]);
  return res.status(201).json(saved);
}

function parseBody(body) {
  if (typeof body === 'string') return JSON.parse(body || '{}');
  return body || {};
}
