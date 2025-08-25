const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productoSchema = new Schema({
  sku: { type: String, required: true, unique: true, trim: true },
  nombre: { type: String, required: true, trim: true },
  precio: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0 },
  imagenUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('producto', productoSchema);