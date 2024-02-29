const mongoose = require('mongoose');


const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
  minimumPurchase:{
    type:Number,
    required:true
  },
  maxdiscount:{
    type:Number,
    required:true
  },
  usedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  usedAt: [{
    type: Date,
  }],
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
