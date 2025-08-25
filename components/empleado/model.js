const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const reqStr = { type: String, required: true, trim: true };

const empleado_schema = new Schema({
  cedula: { ...reqStr, unique: true },
  nombre: reqStr,
  email: { ...reqStr, unique: true, lowercase: true },
  contrasena: reqStr,
  rol: { type: String, enum: ['ADMIN', 'CAJERO', 'COCINERO', 'REPARTIDOR'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('empleado', empleado_schema);
