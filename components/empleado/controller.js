const bcrypt = require('bcryptjs');
const storage = require('./storage');

function get_Empleado(f) { return storage.get(f); }

async function add_Empleado(emp) {
  if (!emp?.cedula || !emp?.rol || !emp?.contrasena) throw 'Datos incompletos';
  emp.contrasena = await bcrypt.hash(emp.contrasena, 10);
  return storage.add(emp);
}

async function update_Empleado(emp) {
  if (emp.contrasena) emp.contrasena = await bcrypt.hash(emp.contrasena, 10);
  const ok = await storage.update(emp);
  if (!ok) throw 'No existe este empleado';
  return ok;
}

function delete_Empleado(emp) { return storage.delete(emp); }

module.exports = { get_Empleado, add_Empleado, update_Empleado, delete_Empleado };
