const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../network/secure');
const Cliente = require('../cliente/model');
const Empleado = require('../empleado/model');
const response = require('../../network/response');

const route = express.Router();

route.post('/cliente/login', async (req, res) => {
  try {
    const { email, contrasena } = req.body;
    const c = await Cliente.findOne({ email });
    if (!c) return response.error(req, res, 'Credenciales', 401);
    const ok = await bcrypt.compare(contrasena, c.contrasena);
    if (!ok) return response.error(req, res, 'Credenciales', 401);
    const token = jwt.sign({ id: c._id, rol: 'CLIENTE', tipo: 'cliente' }, JWT_SECRET, { expiresIn: '8h' });
    response.success(req, res, { token, nombre: c.nombre }, 200);
  } catch (e) { response.error(req, res, e, 500); }
});

route.post('/empleado/login', async (req, res) => {
  try {
    const { email, contrasena } = req.body;
    const u = await Empleado.findOne({ email });
    if (!u) return response.error(req, res, 'Credenciales', 401);
    const ok = await bcrypt.compare(contrasena, u.contrasena);
    if (!ok) return response.error(req, res, 'Credenciales', 401);
    const token = jwt.sign({ id: u._id, rol: u.rol, tipo: 'empleado' }, JWT_SECRET, { expiresIn: '8h' });
    response.success(req, res, { token, nombre: u.nombre, rol: u.rol }, 200);
  } catch (e) { response.error(req, res, e, 500); }
});

module.exports = route;
