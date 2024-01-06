const Razorpay = require('razorpay');
const Order = require('../models/orderModel');
const User = require('../models/userModel'); 
const Product = require('../models/productModel');
const asyncHandler = require("express-async-handler")

const razorpay = new Razorpay({
  key_id: 'your_key_id',
  key_secret: 'your_key_secret',
  
});

const orderProductOnline = asyncHandler(async (req, res) => {
  try {
    const userId = req.session.user.userId;
    const productId = req.query.productId;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const appliedCoupon = req.session.appliedCoupon;

    // Calculate the total amount to be paid, considering any applied coupon for discounts
    const totalAmount = appliedCoupon ? appliedCoupon.discountedPrice : product.price;

    // Create a Razorpay order
    const orderId = `order_${Date.now()}_${Math.ceil(Math.random() * 1000)}`;

    const razorpayOptions = {
      amount: totalAmount * 100, // Amount in paise
      currency: 'INR', // Change to your currency code
      receipt: orderId, // Unique identifier for the order
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOptions);

    // Store the Razorpay order details in your database
    const order = new Order({
      user: userId,
      products: [{
        product: product._id,
        quantity: 1,
        title: product.title,
        price: totalAmount,
        images: product.images,
      }],
      totalAmount: totalAmount,
      paymentMethod: 'Online', // Change to reflect the online payment method
      razorpayOrderId: razorpayOrder.id,
    });

    await order.save();

    // Send the Razorpay details to the client for checkout
    res.json({
      orderId: razorpayOrder.id,
      totalAmount: razorpayOrder.amount,
      // Add any other data you want to send to the client for Razorpay checkout
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating Razorpay order' });
  }
});


module.exports = {
  orderProductOnline,
  
};
