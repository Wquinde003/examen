const Pedido = require('./model');
const Producto = require('../producto/model');

async function crearPedido({ clienteId, items }) {
  const prodMap = new Map();
  const ids = items.map(i => i.productoId);
  const prods = await Producto.find({ _id: { $in: ids } });
  prods.forEach(p => prodMap.set(String(p._id), p));

  const lineas = items.map(i => {
    const p = prodMap.get(i.productoId);
    return {
      producto: p._id,
      nombre: p.nombre,
      cantidad: i.cantidad,
      precioUnit: p.precio
    };
  });
  const total = lineas.reduce((s, l) => s + l.cantidad * l.precioUnit, 0);
  const pedido = await new Pedido({
    cliente: clienteId,
    items: lineas,
    total,
    historial: [{ estado: 'CREADO', nota: 'Pedido creado' }]
  }).save();
  return pedido;
}

const get = (id) => id ? Pedido.findById(id) : Pedido.find();
async function setEstado(id, estado, data = {}) {
  const p = await Pedido.findById(id);
  if (!p) return null;
  Object.assign(p, data);
  p.estado = estado;
  p.historial.push({ estado, nota: data.nota });
  return p.save();
}

module.exports = { crearPedido, get, setEstado };
