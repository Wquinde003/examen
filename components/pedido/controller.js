const storage = require('./storage');
const bus = require('./bus');

module.exports = {
  crear: async (payload) => {
    const p = await storage.crearPedido(payload);
    bus.publish(String(p._id), { tipo: 'estado', estado: p.estado, historial: p.historial });
    return p;
  },
  listar: (id) => storage.get(id),
  cambiarEstado: async (id, estado, data) => {
    const p = await storage.setEstado(id, estado, data);
    if (!p) throw 'Pedido no encontrado';
    bus.publish(String(p._id), { tipo: 'estado', estado: p.estado, historial: p.historial, repartidor: p.repartidor });
    return p;
  }
};
