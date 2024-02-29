const Razorpay = require('razorpay');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const CategoryOffer = require("../models/categoryOfferModel")
const asyncHandler = require("express-async-handler")
const { generatePDFInvoice } = require('../controller/userController');
const razorpay = new Razorpay({
  key_id: 'rzp_test_NzVIitzU3SQBqm',
  key_secret: 'Lhf4d703rP6rta3b7bBojaRS',
});

const calculateDiscountedPrice = (originalPrice, offerPercentage) => {
  if (offerPercentage && offerPercentage > 0 && offerPercentage <= 100) {
      const discountAmount = (originalPrice * offerPercentage) / 100;
      const discountedPrice = originalPrice - discountAmount;

      return Math.round(discountedPrice * 100) / 100;
  } else {
      return originalPrice;
  }
};

const orderProductOnline = asyncHandler(async (req, res) => {
  try {
    const userId = req.session.user.userId;
    const productId = req.body.productId;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const product = await Product.findById(productId);
    const categoryOffer = await CategoryOffer.findOne({ category: product.category });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate offer price if applicable
    const offerPrice = categoryOffer ? calculateDiscountedPrice(product.price, categoryOffer.offerPercentage) : null;

    // Check if a coupon is applied
    const appliedCoupon = req.session.appliedCoupon;

    // Calculate total amount based on coupon, offer, or original price
    const totalAmount = appliedCoupon ? appliedCoupon.discountedPrice : (offerPrice ? offerPrice : product.price);

    // Create a unique order ID
    const orderId = `order_${Date.now()}_${Math.ceil(Math.random() * 1000)}`;

    // Create Razorpay order
    const razorpayOptions = {
      amount: totalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: orderId,
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOptions);

    // Check product availability
    if (product.quantity > 0) {
      product.quantity -= 1;
      await product.save();
    } else {
      // Handle the case where the product is out of stock
      return res.status(400).json({ error: 'Product is out of stock' });
    }

    // Create the order
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
      paymentMethod: 'Online',
      razorpayOrderId: razorpayOrder.id,
    });
    order.invoicePath = await generatePDFInvoice(order);
    await order.save();
    user.orders.push(order._id);
    await user.save({ validateBeforeSave: false });

    const orderSuccess = true;
    res.json({
      orderId: razorpayOrder.id,
      totalAmount: razorpayOrder.amount,
      razorpayCheckoutURL: razorpayOrder.short_url,
      orderSuccess: orderSuccess,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating Razorpay order' });
  }
});



const orderFromCartOnline = asyncHandler(async (req, res) => {
  try {
      const userId = req.session.user.userId;
      const totalAmount = req.body.totalAmount;
      const user = await User.findById(userId).populate({
          path: 'cart.product',
          select: 'title images price quantity', // Include the 'quantity' field for the product
      });

      if (!user || !user.cart.length) {
          return res.status(404).json({ error: 'User cart is empty' });
      }

      // Create an array to store promises for updating product quantities
      const updateProductQuantities = [];

      const orderProducts = user.cart.map(item => {
          // Create a promise to update the product quantity
          const updateQuantityPromise = Product.findByIdAndUpdate(item.product._id, {
              $inc: { quantity: -item.quantity }, // Decrement product quantity
          });

          updateProductQuantities.push(updateQuantityPromise);

          const product = item.product;

          return {
              product: product._id,
              quantity: item.quantity,
              title: product.title,
              price: item.price,
              images: product.images,
              Istatus: "ordered",
          };
      });
      await Promise.all(updateProductQuantities);

      const orderId = `order_${Date.now()}_${Math.ceil(Math.random() * 1000)}`;

      const razorpayOptions = {
          amount: totalAmount * 100,
          currency: 'INR',
          receipt: orderId,
      };

      const razorpayOrder = await razorpay.orders.create(razorpayOptions);

      const order = new Order({
          user: userId,
          products: orderProducts,
          totalAmount: totalAmount,
          paymentMethod: 'Online',
          razorpayOrderId: razorpayOrder.id,
      });
      order.invoicePath = await generatePDFInvoice(order);

      await order.save();

      user.cart = [];
      user.orders.push(order._id);

      await user.save({ validateBeforeSave: false });
      const razorpayCheckoutURL = razorpayOrder.short_url;

      res.json({
          orderId: razorpayOrder.id,
          totalAmount: razorpayOrder.amount,
          razorpayCheckoutURL: razorpayCheckoutURL,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error creating Razorpay order from cart' });
  }
});


module.exports = {
  orderProductOnline, orderFromCartOnline

};
