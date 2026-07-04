const { allowCors } = require('./_lib/storage');

module.exports = function handler(req, res) {
  if (allowCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ message: 'Método no permitido' });

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const baseUrl = `${proto}://${host}`;

  res.status(200).json({
    lanIp: null,
    registrationUrl: `${baseUrl}/registro?modo=visitante`
  });
};
