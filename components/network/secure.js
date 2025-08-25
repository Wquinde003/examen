const jwt = require('jsonwebtoken');
const { JWT_SECRET = 'super-secreto' } = process.env;

function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const tokenHeader = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const tokenQuery = req.query?.token || null;
  const token = tokenHeader || tokenQuery;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function allowRoles(...roles) {
  return (req, res, next) =>
    roles.includes(req.user?.rol) ? next() : res.status(403).json({ error: 'Prohibido' });
}

module.exports = { verifyToken, allowRoles, JWT_SECRET };
