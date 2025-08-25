const storage = require('./storage');

module.exports = {
  get: (f) => storage.get(f),
  add: (m) => {
    if (!m?.nombre || !Array.isArray(m.items)) throw 'Datos de menú inválidos';
    return storage.add(m);
  },
  update: async (m) => {
    const r = await storage.update(m);
    if (!r) throw 'Menú no existe';
    return r;
  },
  remove: (m) => storage.remove(m),
};
