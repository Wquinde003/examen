const express = require('express');
const fs = require('fs');
const path = require('path');
const response = require('../../network/response');
const controller = require('./controller');
const { verifyToken, allowRoles } = require('../network/secure');

const route = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function saveBase64Image(dataUrl, namePrefix) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  const [meta, b64] = dataUrl.split(',');
  const m = meta.match(/^data:(.*);base64$/);
  const mime = m ? m[1] : 'image/png';
  const ext = (mime.split('/')[1] || 'png').toLowerCase();
  const file = `${namePrefix}-${Date.now()}.${ext}`;
  const full = path.join(UPLOAD_DIR, file);
  fs.writeFileSync(full, Buffer.from(b64, 'base64'));
  return `/public/uploads/${file}`;
}

route.get('/', (req, res) => {
  controller.get(req.query.sku || null)
    .then(d => response.success(req, res, d, 200))
    .catch(e => response.error(req, res, e, 500));
});

route.post('/', verifyToken, allowRoles('ADMIN'), async (req, res) => {
  try {
    const { sku, nombre, precio, stock, imagenBase64 } = req.body;
    let imagenUrl = '';
    if (imagenBase64) imagenUrl = saveBase64Image(imagenBase64, sku);
    const data = await controller.add({ sku, nombre, precio, stock, imagenUrl });
    response.success(req, res, data, 201);
  } catch (e) {
    response.error(req, res, e.message || e, 500);
  }
});

route.put('/', verifyToken, allowRoles('ADMIN'), async (req, res) => {
  try {
    const { sku, nombre, precio, stock, imagenBase64 } = req.body;
    const patch = { sku, nombre, precio, stock };
    if (imagenBase64) patch.imagenUrl = saveBase64Image(imagenBase64, sku);
    const data = await controller.update(patch);
    response.success(req, res, data, 200);
  } catch (e) {
    response.error(req, res, e.message || e, 500);
  }
});

route.delete('/', verifyToken, allowRoles('ADMIN'), (req, res) => {
  controller.remove(req.body)
    .then(d => response.success(req, res, d, 200))
    .catch(e => response.error(req, res, e, 500));
});

module.exports = route;
