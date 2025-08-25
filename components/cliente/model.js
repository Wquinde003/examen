const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reqStr = { type: String, required: true, trim: true };

const cliente_schema = new Schema({
  cedula: { ...reqStr, unique: true },
  nombre: reqStr,
  email: { ...reqStr, unique: true, lowercase: true },
  contrasena: reqStr,
}, { timestamps: true });

module.exports = mongoose.model('cliente', cliente_schema);
