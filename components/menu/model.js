const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  sku: { type: String, required: true },
  nombre: { type: String, required: true },
  cantidad: { type: Number, default: 1, min: 1 },
  precio: { type: Number, required: true, min: 0 }
}, { _id: false });

const menuSchema = new Schema({
  nombre: { type: String, required: true, unique: true, trim: true },
  items: { type: [itemSchema], default: [] },
  precio: { type: Number, min: 0 },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('menu', menuSchema);
