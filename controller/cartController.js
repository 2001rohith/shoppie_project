const mongoose = require('mongoose');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const asyncHandler = require('express-async-handler');

const addToCart = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
  
    try {
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const cartItem = {
        product: id,
        quantity: quantity || 1,
        price: product.offerPrice !== undefined && product.offerPrice !== null ? product.offerPrice : product.price,
        images: product.images,
      };
  
      const existingCartItem = user.cart.find((item) => item.product.equals(id));
  
      if (existingCartItem) {
        existingCartItem.quantity += cartItem.quantity;
      } else {
        user.cart.push(cartItem);
      }
  
      //await user.markModified('cart');
      await user.save({ validateBeforeSave: false });
  
      res.redirect("/product/get-cart-items");
      //res.render("cartSuccess");
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  





const removeFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const user = await User.findById(req.user.userId);
    user.cart = user.cart.filter((item) => !item.product.equals(productId));
    //await user.markModified('cart');
    await user.save({ validateBeforeSave: false });

    res.redirect("/product/get-cart-items");
});


const updateCartItem = asyncHandler(async (req, res) => {
    try {
        const { cartItemId } = req.params;
        const { quantity } = req.body;

        console.log('Received Ajax Request:', req.body); 

        const user = await User.findById(req.user.userId);

        const cartItem = user.cart.id(cartItemId);
        if (cartItem) {
            let updatedQuantity;  

            if (quantity !== undefined && !isNaN(quantity)) {
                const originalQuantity = cartItem.quantity;
                updatedQuantity = Number(quantity);  

                const originalPrice = cartItem.price;
                const updatedPrice = (originalPrice / originalQuantity) * updatedQuantity;

                cartItem.set({ quantity: updatedQuantity, price: updatedPrice });
            } else {
                return res.status(400).json({ success: false, message: 'Invalid quantity value' });
            }

            await user.save({ validateBeforeSave: false });
            const totalAmount = calculateTotalAmount(user.cart)
            const shippingCharge = totalAmount < 100 ? 20 : 0;

            return res.json({
                success: true,
                message: 'Cart item updated successfully',
                updatedQuantity,
                totalAmount,
                shippingCharge
            });
        } else {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }
    } catch (error) {
        console.error('Error updating cart item:', error); 
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});





const calculateTotalAmount = (cart) => {
    return cart.reduce((total, item) => total + (item.discountedPrice || item.price), 0);
};


const getCartItems = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId).populate({
        path: 'cart.product',
        select: 'title images price quantity',
    });

    const totalAmount = calculateTotalAmount(user.cart);
    const shippingCharge = totalAmount < 100 ? 20 : 0;
    res.render('userViewCart', { cart: user.cart, user: user, totalAmount,shippingCharge });
});

module.exports = { addToCart, removeFromCart, updateCartItem, getCartItems };
