const bcrypt = require('bcryptjs');
const storage = require('./storage');

function get_Cliente(f) { return storage.get(f); }

async function add_Cliente(cli) {
  if (!cli?.cedula || !cli?.email || !cli?.contrasena) throw 'Datos incompletos';
  const hash = await bcrypt.hash(cli.contrasena, 10);
  cli.contrasena = hash;
  return await storage.add(cli);
}

async function update_Cliente(cli) {
  if (cli.contrasena) cli.contrasena = await bcrypt.hash(cli.contrasena, 10);
  const ok = await storage.update(cli);
  if (!ok) throw 'No existe este cliente.';
  return ok;
}

function delete_Cliente(cli) { return storage.delete(cli); }

module.exports = { get_Cliente, add_Cliente, update_Cliente, delete_Cliente };
