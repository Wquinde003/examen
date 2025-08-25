const model = require('./model');

const get = (f) => model.find(f ? { sku: f } : {});

const add = (p) => {
  if (p.precio !== undefined) p.precio = Number(p.precio);
  if (p.stock !== undefined) p.stock = Number(p.stock);
  return new model(p).save();
};

const update = async (p) => {
  if (!p || !p.sku) return null;

  const o = await model.findOne({ sku: p.sku });
  if (!o) return null;

  if (p.nombre !== undefined) o.nombre = p.nombre;
  if (p.precio !== undefined) o.precio = Number(p.precio);
  if (p.stock !== undefined) o.stock = Number(p.stock);
  if (p.imagenUrl !== undefined) o.imagenUrl = p.imagenUrl;


  return o.save();
};

const remove = (p) => model.deleteOne({ sku: p.sku });

module.exports = { get, add, update, remove };
