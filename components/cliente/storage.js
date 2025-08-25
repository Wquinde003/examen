const model = require('./model');

function get_Cliente(filtroCedula) {
  const filtro = filtroCedula ? { cedula: filtroCedula } : {};
  return model.find(filtro);
}

async function add_Cliente(cliente) {
  const obj = new model(cliente);
  return await obj.save();
}

async function update_Cliente(cliente) {
  const obj = await model.findOne({ cedula: cliente.cedula });
  if (!obj) return null;
  obj.nombre = cliente.nombre ?? obj.nombre;
  obj.email = cliente.email ?? obj.email;
  if (cliente.contrasena) obj.contrasena = cliente.contrasena;
  return await obj.save();
}

function delete_Cliente(cliente) {
  return model.deleteOne({ cedula: cliente.cedula });
}

module.exports = { add: add_Cliente, get: get_Cliente, update: update_Cliente, delete: delete_Cliente };
