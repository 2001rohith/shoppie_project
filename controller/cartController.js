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
            price: product.price,
            images: product.images
        };

        const existingCartItem = user.cart.find((item) => item.product.equals(id));

        if (existingCartItem) {
            existingCartItem.quantity += cartItem.quantity;
        } else {
            user.cart.push(cartItem);
        }

        await user.markModified('cart');
        await user.save({ validateBeforeSave: false });

        res.render("cartSuccess")
        //res.redirect('/api/product/get-cart-items')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});





const removeFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const user = await User.findById(req.user.userId);
    user.cart = user.cart.filter((item) => !item.product.equals(productId));
    await user.markModified('cart');
    await user.save({ validateBeforeSave: false });

    res.redirect("/api/product/get-cart-items");
});


const updateCartItem = asyncHandler(async (req, res) => {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    const user = await User.findById(req.user.userId);

    const cartItem = user.cart.id(cartItemId);
    if (cartItem) {
        if (quantity !== undefined && !isNaN(quantity)) {
            const originalQuantity = cartItem.quantity;
            const updatedQuantity = Number(quantity);

            const originalPrice = cartItem.price;
            const updatedPrice = (originalPrice / originalQuantity) * updatedQuantity;

            cartItem.set({ quantity: updatedQuantity, price: updatedPrice });
        } else {
            return res.status(400).json({ message: 'Invalid quantity value' });
        }
        await user.save({ validateBeforeSave: false });

        res.redirect("/api/product/get-cart-items");
    } else {
        res.status(404).json({ message: 'Cart item not found' });
    }
});







const getCartItems = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId).populate({
        path: 'cart.product',
        select: 'title image price',
    });

    res.render('userViewCart', { cart: user.cart, user: user });
    console.log("cart item in getcart is:", user.cart);
});

module.exports = { addToCart, removeFromCart, updateCartItem, getCartItems };
