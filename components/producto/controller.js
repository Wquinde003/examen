const storage = require('./storage');

module.exports = {
  get: (f) => storage.get(f),
  add: (p) => {
    if (!p?.sku || !p?.nombre) throw 'Faltan datos del producto';
    return storage.add(p);
  },
  update: async (p) => {
    const r = await storage.update(p);
    if (!r) throw 'No existe';
    return r;
  },
  remove: (p) => storage.remove(p),
};
