const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: [4, "Name should be at least 4 characters"],
    maxlength: [10, "Name cannot exceed 10 characters"],
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message: "Invalid email format",
    },
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    minlength: [10, "Mobile number should be 10 digits"],
    maxlength: [10, "Mobile number should be 10 digits"],
    trim: true,
    validate: {
      validator: function (value) {
        const mobileRegex = /^[0-9]{10}$/;
        return mobileRegex.test(value);
      },
      message: "Invalid mobile number format",
    },
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        return strongPasswordRegex.test(value);
      },
      message: "Password should be 6 digits and strong,please include uppercase letters and special character",
    },
  },
  resetToken: {
    type: String
  },
  role: {
    type: String,
    default: "user",
  },
  otp: {
    type: String,
  },
  otpTimestamp: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  cart: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 },
      price: { type: Number },
    },
  ], orders:
    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],

  address: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'Address'
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'Product'
  }],
  Coupons: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'Coupon',
  }],
  refreshToken: {
    type: String,
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSaltSync(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (!this.otpTimestamp) {
    this.otpTimestamp = new Date();
  }
  next();
});

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
