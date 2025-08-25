const model = require('./model');

function get_Empleado(filtroCedula) {
  return model.find(filtroCedula ? { cedula: filtroCedula } : {});
}

async function add_Empleado(e) {
  const o = new model(e);
  return o.save();
}

async function update_Empleado(e) {
  const o = await model.findOne({ cedula: e.cedula });
  if (!o) return null;
  o.nombre = e.nombre ?? o.nombre;
  o.email = e.email ?? o.email;
  o.rol = e.rol ?? o.rol;
  if (e.contrasena) o.contrasena = e.contrasena;
  return o.save();
}

function delete_Empleado(e) {
  return model.deleteOne({ cedula: e.cedula });
}

module.exports = { get: get_Empleado, add: add_Empleado, update: update_Empleado, delete: delete_Empleado };
