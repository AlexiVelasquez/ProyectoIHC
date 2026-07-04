const { allowCors, hasKv, readVisits, sendError } = require('./_lib/storage');

module.exports = async function handler(req, res) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ message: 'Método no permitido' });

  try {
    const visits = await readVisits();
    res.status(200).json({
      status: 'ok',
      storage: hasKv() ? 'vercel-kv' : 'json',
      total: visits.length
    });
  } catch (error) {
    sendError(res, error);
  }
};
