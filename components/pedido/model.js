const mongoose = require('mongoose');
const { Schema } = mongoose;

const itemSchema = new Schema({
  sku: String,
  nombre: String,
  cantidad: { type: Number, min: 1 },
  precio: { type: Number, min: 0 },
  imagenUrl: String,
}, { _id: false });

const clienteSchema = new Schema({
  cedula: String,
  nombre: String,
  email: String,
}, { _id: false });

const pagoSchema = new Schema({
  metodo: String,
  monto: Number,
  fecha: Date
}, { _id: false });

const repartidorSchema = new Schema({
  repartidor: {
    cedula: String,
    nombre: String,
    email: String,
  },
  asignado: { type: Boolean, default: false },
  fechaAsignacion: Date,
  fechaDespacho: Date,
  fechaEntrega: Date,
  fechaRecepcionCliente: Date,
}, { _id: false });


const pedidoSchema = new Schema({
  cliente: clienteSchema,
  items: [itemSchema],
  total: { type: Number, min: 0, default: 0 },

  estado: {
    type: String,
    enum: ['CREADO', 'PAGADO', 'EN_COCINA', 'LISTO', 'DESPACHADO', 'ENTREGA_PENDIENTE', 'ENTREGADO'],
    default: 'CREADO',
    index: true
  },

  pago: pagoSchema,

  reparto: repartidorSchema,

}, { timestamps: true, versionKey: false });

pedidoSchema.index({ createdAt: -1 });
pedidoSchema.index({ 'reparto.repartidor.cedula': 1 });

module.exports = mongoose.model('pedido', pedidoSchema);
