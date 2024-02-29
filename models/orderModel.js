const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 },
      title: { type: String },
      price: { type: Number },
      images: { type: [String] },
      Istatus: { type: String },
    },
  ],
  status: { type: String, default: 'pending' },
  paymentMethod: {
    type: String
  },
  totalAmount: {
    type: Number
  },
  isDamaged: {
    type: Boolean,
    default: false
  },
  invoicePath: {
    type: String,
  },
  shippingCharge: {
    type: Number,
  },
}, { timestamps: true });


module.exports = mongoose.model('Order', orderSchema);
