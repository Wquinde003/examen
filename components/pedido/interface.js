const express = require('express');
const response = require('../../network/response');
const Pedido = require('./model');
const Cliente = require('../cliente/model');
const Empleado = require('../empleado/model');
const { verifyToken, allowRoles } = require('../network/secure');

const route = express.Router();

route.get('/', verifyToken, async (req, res) => {
  try {
    const { estado, repartidorCedula } = req.query;
    const match = {};
    if (estado) {
      const arr = estado.split(',').map(s => s.trim()).filter(Boolean);
      match.estado = arr.length > 1 ? { $in: arr } : arr[0];
    }
    if (repartidorCedula) match['reparto.repartidor.cedula'] = repartidorCedula;

    const pedidos = await Pedido.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          clienteObjId: {
            $switch: {
              branches: [
                { case: { $eq: [{ $type: '$cliente' }, 'objectId'] }, then: '$cliente' },
                {
                  case: {
                    $and: [
                      { $eq: [{ $type: '$cliente' }, 'string'] },
                      { $regexMatch: { input: '$cliente', regex: /^[0-9a-fA-F]{24}$/ } }
                    ]
                  },
                  then: { $toObjectId: '$cliente' }
                },
                { case: { $eq: [{ $type: '$idCliente' }, 'objectId'] }, then: '$idCliente' },
                {
                  case: {
                    $and: [
                      { $eq: [{ $type: '$idCliente' }, 'string'] },
                      { $regexMatch: { input: '$idCliente', regex: /^[0-9a-fA-F]{24}$/ } }
                    ]
                  },
                  then: { $toObjectId: '$idCliente' }
                }
              ],
              default: null
            }
          }
        }
      },
      { $lookup: { from: 'clientes', localField: 'clienteObjId', foreignField: '_id', as: 'cliById' } },
      { $lookup: { from: 'clientes', localField: 'cedula', foreignField: 'cedula', as: 'cliByCed' } },
      { $lookup: { from: 'clientes', localField: 'clienteCedula', foreignField: 'cedula', as: 'cliByCed2' } },
      {
        $addFields: {
          _cli: {
            $ifNull: [
              { $first: '$cliById' },
              { $ifNull: [{ $first: '$cliByCed' }, { $first: '$cliByCed2' }] }
            ]
          }
        }
      },
      {
        $addFields: {
          cliente: {
            $cond: [
              { $gt: [{ $type: '$_cli' }, 'missing'] },
              { cedula: '$_cli.cedula', nombre: '$_cli.nombre', email: '$_cli.email' },
              '$cliente'
            ]
          },
          clienteNombre: '$_cli.nombre'
        }
      },
      { $project: { cliById: 0, cliByCed: 0, cliByCed2: 0, _cli: 0, clienteObjId: 0 } }
    ]);

    response.success(req, res, pedidos, 200);
  } catch (e) {
    response.error(req, res, e, 500);
  }
});

route.post('/', verifyToken, allowRoles('CLIENTE', 'ADMIN'), async (req, res) => {
  try {
    const itemsRaw = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!itemsRaw.length) return response.error(req, res, 'Items requeridos', 400);

    const items = itemsRaw.map(x => ({
      sku: String(x.sku || '').trim(),
      nombre: String(x.nombre || '').trim(),
      cantidad: Math.max(1, parseInt(x.cantidad || 1)),
      precio: Number(x.precio || 0),
      imagenUrl: x.imagenUrl || null
    }));
    const total = items.reduce((a, b) => a + b.precio * b.cantidad, 0);

    const u = req.user || {};
    const userId = u.id || u._id || u.sub || null;

    let cliSnap = null;
    if (u.cedula || u.nombre || u.email) {
      cliSnap = { cedula: u.cedula || null, nombre: u.nombre || null, email: u.email || null };
    }
    if (!cliSnap && userId) {
      const c = await Cliente.findById(userId, { cedula: 1, nombre: 1, email: 1 }).lean();
      if (c) cliSnap = { cedula: c.cedula || null, nombre: c.nombre || null, email: c.email || null };
    }

    const nuevo = await Pedido.create({
      cliente: cliSnap || null,
      idCliente: userId || null,
      clienteCedula: cliSnap?.cedula || u.cedula || null,
      clienteEmail: cliSnap?.email || u.email || null,
      items,
      total,
      estado: 'CREADO'
    });

    return response.success(req, res, nuevo, 201);
  } catch (e) {
    return response.error(req, res, e, 500);
  }
});

route.put('/pagar', verifyToken, allowRoles('CAJERO', 'ADMIN'), async (req, res) => {
  try {
    const { id, metodo, monto } = req.body;
    const p = await Pedido.findById(id);
    if (!p) return response.error(req, res, 'No existe', 404);
    if (p.estado !== 'CREADO') return response.error(req, res, 'Estado inválido', 400);

    p.pago = { metodo: metodo || 'EFECTIVO', monto: Number(monto || p.total), fecha: new Date() };
    p.estado = 'PAGADO';
    await p.save();
    response.success(req, res, p, 200);
  } catch (e) {
    response.error(req, res, e, 500);
  }
});

route.put('/a-cocina', verifyToken, allowRoles('CAJERO', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.body;
    const p = await Pedido.findById(id);
    if (!p) return response.error(req, res, 'No existe', 404);
    if (p.estado !== 'PAGADO') return response.error(req, res, 'Debe estar PAGADO', 400);
    p.estado = 'EN_COCINA';
    await p.save();
    response.success(req, res, p, 200);
  } catch (e) {
    response.error(req, res, e, 500);
  }
});

route.put('/marcar-listo', verifyToken, allowRoles('COCINERO', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.body;
    const p = await Pedido.findById(id);
    if (!p) return response.error(req, res, 'No existe', 404);
    if (p.estado !== 'EN_COCINA') return response.error(req, res, 'Debe estar EN_COCINA', 400);
    p.estado = 'LISTO';
    await p.save();
    response.success(req, res, p, 200);
  } catch (e) {
    response.error(req, res, e, 500);
  }
});

route.put('/despachar', verifyToken, allowRoles('CAJERO', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.body;
    const p = await Pedido.findById(id);
    if (!p) return response.error(req, res, 'No existe', 404);
    if (p.estado !== 'LISTO') return response.error(req, res, 'Debe estar LISTO', 400);
    p.estado = 'DESPACHADO';
    p.reparto = { ...(p.reparto || {}), fechaDespacho: new Date() };
    await p.save();
    response.success(req, res, p, 200);
  } catch (e) {
    response.error(req, res, e, 500);
  }
});

route.get('/repartidores', verifyToken, allowRoles('CAJERO', 'ADMIN'), async (req, res) => {
  try {
    const reps = await Empleado.find({ rol: 'REPARTIDOR' }, { _id: 0, cedula: 1, nombre: 1, email: 1 }).lean();
    response.success(req, res, reps, 200);
  } catch (e) {
    response.error(req, res, e, 500);
  }
});

route.put('/asignar-repartidor', verifyToken, allowRoles('CAJERO', 'ADMIN'), async (req, res) => {
  try {
    const { id, cedula } = req.body;
    const p = await Pedido.findById(id);
    if (!p) return response.error(req, res, 'No existe', 404);
    if (p.estado !== 'LISTO') return response.error(req, res, 'El pedido debe estar LISTO', 400);

    const rep = await Empleado.findOne({ cedula, rol: 'REPARTIDOR' }, { _id: 0, cedula: 1, nombre: 1, email: 1 }).lean();
    if (!rep) return response.error(req, res, 'Repartidor no válido', 400);

    p.reparto = {
      repartidor: rep,
      asignado: true,
      fechaAsignacion: new Date(),
      fechaDespacho: p?.reparto?.fechaDespacho || null,
      fechaEntrega: p?.reparto?.fechaEntrega || null,
      fechaRecepcionCliente: p?.reparto?.fechaRecepcionCliente || null
    };
    await p.save();
    response.success(req, res, p, 200);
  } catch (e) {
    response.error(req, res, e, 500);
  }
});

route.put('/confirmar-entrega', verifyToken, allowRoles('REPARTIDOR', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.body;
    const p = await Pedido.findById(id);
    if (!p) return response.error(req, res, 'No existe', 404);
    if (p.estado !== 'DESPACHADO') return response.error(req, res, 'El pedido debe estar DESPACHADO', 400);

    p.estado = 'ENTREGA_PENDIENTE';
    p.reparto = { ...(p.reparto || {}), fechaEntrega: new Date(), entregadoPorRepartidor: true };
    await p.save();
    response.success(req, res, p, 200);
  } catch (e) {
    response.error(req, res, e, 500);
  }
});

route.put('/confirmar-recepcion', verifyToken, allowRoles('CLIENTE', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.body;
    const p = await Pedido.findById(id);
    if (!p) return response.error(req, res, 'No existe', 404);
    if (p.estado !== 'ENTREGA_PENDIENTE') return response.error(req, res, 'Debe estar ENTREGA_PENDIENTE', 400);

    p.estado = 'ENTREGADO';
    p.reparto = { ...(p.reparto || {}), fechaRecepcionCliente: new Date() };
    await p.save();
    response.success(req, res, p, 200);
  } catch (e) {
    response.error(req, res, e, 500);
  }
});

route.get('/mis', verifyToken, async (req, res) => {
  try {
    const u = req.user || {};
    let { cedula = null, email = null } = u;
    const id = u.id || u._id || u.sub || null;

    if (!cedula && !email && id) {
      try {
        const cli = await Cliente.findById(id, { cedula: 1, email: 1 }).lean();
        if (cli) {
          cedula = cli.cedula || null;
          email = cli.email || null;
        }
      } catch (_) { }
    }

    const or = [];
    if (id) or.push({ idCliente: id });
    if (cedula) or.push({ 'cliente.cedula': cedula }, { clienteCedula: cedula }, { cedula });
    if (email) or.push({ 'cliente.email': email }, { clienteEmail: email }, { email });

    const query = or.length ? { $or: or } : { _id: null };
    const pedidos = await Pedido.find(query).sort({ createdAt: -1 }).lean();
    return response.success(req, res, pedidos, 200);
  } catch (e) {
    return response.error(req, res, e, 500);
  }
});

module.exports = route;
