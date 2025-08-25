const express = require('express');
const router = express.Router();

router.use('/cliente', require('../components/cliente/interface'));
router.use('/empleado', require('../components/empleado/interface'));
router.use('/producto', require('../components/producto/interface'));
router.use('/pedido', require('../components/pedido/interface'));
router.use('/auth', require('../components/auth/interface'));
router.use('/menu', require('../components/menu/interface'));

module.exports = router;
