const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 },
      title: { type: String }, // Include the product name in the schema
      price: { type: Number },
      images:{type:[String]},
    },
  ],
  status: { type: String, default: 'pending' },
}, { timestamps: true });


module.exports = mongoose.model('Order', orderSchema);
