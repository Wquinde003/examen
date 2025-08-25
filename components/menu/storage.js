const model = require('./model');

const get = (f) => model.find(f ? { nombre: f } : {});
const add = (m) => new model(m).save();

const update = async (m) => {
  if (!m?.nombre) return null;
  const o = await model.findOne({ nombre: m.nombre });
  if (!o) return null;
  if (m.items !== undefined) o.items = m.items;
  if (m.precio !== undefined) o.precio = Number(m.precio);
  if (m.activo !== undefined) o.activo = m.activo;
  return o.save();
};

const remove = (m) => model.deleteOne({ nombre: m.nombre });

module.exports = { get, add, update, remove };
