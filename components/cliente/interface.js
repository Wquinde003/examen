const express = require('express');
const response = require('../../network/response');
const controller = require('./controller');
const route = express.Router();

route.get('/', (req, res) => {
  controller.get_Cliente(req.query.cedula || null)
    .then(data => response.success(req, res, data, 200))
    .catch(err => response.error(req, res, err, 500));
});
route.post('/', (req, res) => {
  controller.add_Cliente(req.body)
    .then(data => response.success(req, res, data, 201))
    .catch(err => response.error(req, res, err, 500));
});
route.put('/', (req, res) => {
  controller.update_Cliente(req.body)
    .then(data => response.success(req, res, data, 200))
    .catch(err => response.error(req, res, err, 500));
});
route.delete('/', (req, res) => {
  controller.delete_Cliente(req.body)
    .then(data => response.success(req, res, data, 200))
    .catch(err => response.error(req, res, err, 500));
});

module.exports = route;
