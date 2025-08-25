const express = require('express');
const response = require('../../network/response');
const controller = require('./controller');

const route = express.Router();

route.post('/', function (req, res) {
  controller.add_Empleado(req.body)
    .then(data => response.success(req, res, data, 201))
    .catch(err => response.error(req, res, err, 500));
});

route.get('/', function (req, res) {
  controller.get_Empleado(req.query.cedula || null)
    .then(data => response.success(req, res, data, 200))
    .catch(err => response.error(req, res, err, 500));
});

route.put('/', function (req, res) {
  controller.update_Empleado(req.body)
    .then(data => response.success(req, res, data, 200))
    .catch(err => response.error(req, res, err, 500));
});

route.delete('/', function (req, res) {
  controller.delete_Empleado(req.body)
    .then(data => response.success(req, res, data, 200))
    .catch(err => response.error(req, res, err, 500));
});

module.exports = route;
