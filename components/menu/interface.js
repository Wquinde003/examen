const express = require('express');
const response = require('../../network/response');
const controller = require('./controller');
const Menu = require('./model');
const { verifyToken, allowRoles } = require('../network/secure');

const route = express.Router();

route.get('/', verifyToken, allowRoles('CLIENTE', 'ADMIN'), async (req, res) => {
  try {
    const menus = await Menu.find({}, { _id: 0 }).lean();
    response.success(req, res, menus, 200);
  } catch (e) {
    response.error(req, res, e, 500);
  }
});

route.post('/', verifyToken, allowRoles('ADMIN'), (req, res) => {
  controller.add(req.body)
    .then(d => response.success(req, res, d, 201))
    .catch(e => response.error(req, res, e, 500));
});

route.put('/', verifyToken, allowRoles('ADMIN'), (req, res) => {
  controller.update(req.body)
    .then(d => response.success(req, res, d, 200))
    .catch(e => response.error(req, res, e, 500));
});

route.delete('/', verifyToken, allowRoles('ADMIN'), (req, res) => {
  controller.remove(req.body)
    .then(d => response.success(req, res, d, 200))
    .catch(e => response.error(req, res, e, 500));
});

module.exports = route;
