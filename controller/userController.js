const User = require("../models/userModel")
const Order = require("../models/orderModel")
const Wallet = require("../models/walletModel")
const Coupon = require("../models/couponModel")
const Return = require("../models/returnModel")
const Address = require("../models/addressModel")
const { generateInvoice } = require('easyinvoice');
const Product = require("../models/productModel")
const CategoryOffer = require('../models/categoryOfferModel');
const Transaction = require("../models/walletTransactionModel")

const asyncHandler = require("express-async-handler")
const generateToken = require("../config/jwtToken")
const jwt = require("jsonwebtoken")
const generateOTP = require("../services/generateOtp")
const sendEmail = require("../services/emailotp")
const { generateResetToken, verifyResetToken } = require("../services/resetToken");
const bcrypt = require("bcrypt")
const shortid = require("shortid")

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { log } = require("console")
const rootDir = __dirname;

const loadRegister = async (req, res) => {
    try {
        let errors
        res.render("signup", { errors })
    } catch (error) {
        res.render("SomethingWentwrong");
        console.log(error.message)
    }
}
/*const signupUser = asyncHandler(async (req, res) => {
    const { email, password, confirmPassword, } = req.body
    const otp = generateOTP(6, { digits: true, alphabets: false, specialChars: false });
    try {

        const findUser = await User.findOne({ email });
        if (findUser) {
            let errors
            return res.render("signup", { errors, message: "please provide unique email" })

        }
        if (password !== confirmPassword) {
            res.render('signup', { message: "password and confirm password are different " });
        }
        if (!findUser || !findUser.isVerified) {
            if (!findUser) {
                const generatedReferralCode = generateReferralCode();
                await User.create({ ...req.body, otp, isVerified: false, referralCode: generatedReferralCode });
            } else {
                await User.updateOne({ email }, { $set: { ...req.body, otp, isVerified: false, referralCode: generatedReferralCode } });
            }

            await sendEmail(email, 'Verify Your Email', `Your OTP: ${otp}`);

            res.redirect(`/api/user/verify-otp/${email}`);
        } else {
            res.render("SomethingWentwrong");
        }
    } catch (error) {
        if (error.errors) {
            const errors = Object.values(error.errors).map(err => err.message);
            res.render('signup', { errors });
        }

        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            let errors;
            const errorMessage = 'Email address is already in use.';
            res.render("SomethingWentwrong");
        } else {
            let errors
            console.error('Error during registration:', error);
            res.render('signup', { errors, message: 'Registration failed. Please try again.' });
        }

    }
});
*/
const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const signupUser = asyncHandler(async (req, res) => {
    const { email, password, confirmPassword, referredCode } = req.body;
    const otp = generateOTP(6, { digits: true, alphabets: false, specialChars: false });
    try {
        if (!isEmailValid(email)) {
            return res.render("signup", { errors: null, message: "Invalid email format." });
        }

        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render("signup", { errors: null, message: "Please provide a unique email." });
        }

        if (password !== confirmPassword) {
            return res.render('signup', { errors: null, message: "Password and confirm password should be same." });
        }

        let user;
        let referralCode
        if (referredCode) {
            const referrer = await User.findOne({ referralCode: referredCode });
            console.log("referred user : ", referrer);
            if (referrer) {
                const referralAmount = 50;
                referralCode = generateReferralCode();
                user = await User.create({ ...req.body, otp, isVerified: false, isReferred: true, referralCode });

                if (!user.wallet) {
                    const wallet = await Wallet.create({ user: user._id, balance: 0 });
                    user.wallet = wallet._id;
                }
                //const walletInstance = await Wallet.findById(user.wallet);
                const reffererwallet = await Wallet.findById(referrer.wallet)
                //walletInstance.balance += referralAmount;
                reffererwallet.balance += referralAmount;

                //await walletInstance.save();
                await reffererwallet.save();

                await user.save({ validateBeforeSave: false });
                await referrer.save({ validateBeforeSave: false });
            }
        } else {
            referralCode = generateReferralCode();
            user = await User.create({ ...req.body, otp, isVerified: false, referralCode });
            if (!user.wallet) {
                const wallet = await Wallet.create({ user: user._id, balance: 0 });
                user.wallet = wallet._id;
            }

            await user.save({ validateBeforeSave: false });
        }

        await sendEmail(email, 'Verify Your Email', `Your OTP: ${otp}`);
        res.redirect(`/user/verify-otp/${email}`);

    } catch (error) {
        console.log(error);
        res.render("SomethingWentwrong");
        let errors = null;

        if (error.errors) {
            errors = Object.values(error.errors).map(err => err.message);
        }

        res.render('signup', { errors, message: 'Registration failed. Please try again.' });
    }
});


shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');

const generateReferralCode = () => {
    const referralCode = shortid.generate();
    return referralCode;
};

const loadVerify = asyncHandler(async (req, res) => {
    try {
        const email = req.params.id
        console.log(req.params.id);
        //console.log("hi");
        res.render("otpverify", { email })
    } catch (error) {
        res.render("SomethingWentwrong");
    }
})

const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body
    const otp = generateOTP()
    try {
        const user = await User.findOne({ email })

        if (user && !user.isVerified) {
            await User.updateOne({ email }, { $set: { otp } })
            await sendEmail(email, 'Verify Your Email', `Your new OTP: ${otp}`)

            res.render('otpverify', { email, message: 'New OTP sent. Check your email.' })
        } else {
            res.render("SomethingWentwrong");
        }
    } catch (error) {
        console.error('Error during OTP resend:', error);
        res.render('otpverify', { email, message: 'OTP resend failed. Please try again.' })
    }
});

const verifyOtp = asyncHandler(async (req, res) => {
    const { otp, email } = req.body

    try {
        const user = await User.findOne({ email, otp, isVerified: false });

        if (user) {
            const otpSentTime = user.updatedAt;
            const currentTime = new Date();
            const timeDifference = currentTime - otpSentTime;
            const oneMinuteInMillis = 60 * 1000;

            if (timeDifference <= oneMinuteInMillis) {
                await User.updateOne({ email }, { $set: { isVerified: true } });
                res.redirect('/user/login');
            } else {
                res.render("otpverify", { email, message: "Otp expired" })
            }
        } else {
            res.redirect("/user/home");
        }
    } catch (error) {
        console.error('Error during OTP verification:', error);
        res.render('otpverify', { email, message: error.message });
    }
})

const loginLoad = async (req, res) => {
    try {
        res.render("login");
    } catch (error) {
        console.log(error.message);
    }
};

const loginUserCtrl = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const findUser = await User.findOne({ email });

    if (findUser && (await findUser.isPasswordMatched(password))) {
        const isBlocked = findUser.isBlocked;

        if (isBlocked) {
            return res.render("login", { message: "Profile Blocked" });
        }
        req.session.user = {
            userId: findUser._id,
            email: findUser.email,
            name: findUser.name,
            password: findUser.password,
            address: findUser.address,
        };
        return res.redirect("/user/home");
    }

    res.render("login", { message: "Invalid credentials" });
});

const forgotPasswordLoad = async (req, res) => {
    try {
        res.render("forgotPassword");
    } catch (error) {
        console.log(error.message);
        res.render("SomethingWentwrong");

    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const resetToken = generateResetToken();
        const user = await User.findOneAndUpdate({ email }, { resetToken }, { new: true });

        if (!user) {
            return res.render("forgotPassword", { message: "User not found" });
        }
        const resetUrl = `${req.protocol}://${req.get("host")}/user/reset-password/${resetToken}`;
        const message = `Forgot your password? Click here : ${resetUrl}.`;

        await sendEmail(user.email, "Your password reset token (valid for 10 minutes)", message);

        res.render("forgotPassword", { message: "Password reset email sent" });
    } catch (error) {
        console.log(error.message);
        res.render("SomethingWentwrong");

    }
};

const resetPasswordLoad = async (req, res) => {
    try {
        const { token } = req.params;
        const isTokenValid = verifyResetToken(token);
        console.log(token);
        if (isTokenValid) {
            res.render("resetPassword", { token: token });
        } else {
            res.render("resetPassword", { message: "Invalid token or token expired", token: null });
        }
    } catch (error) {
        res.render("SomethingWentwrong");
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({ resetToken: token });

        if (!user) {
            return res.render("resetPassword", { message: "Invalid token or token expired" });
        }
        user.password = password;

        user.resetToken = undefined;
        await user.save();
        res.redirect("/user/login");
    } catch (error) {
        res.render("SomethingWentwrong");
        console.log(error.message);
    }
};

const loadHome = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.userId.toString());

        if (!user) {
            return res.redirect('/user/login');
        }

        const latestProducts = await Product.find({ softDelete: false }).sort({ createdAt: -1 }).limit(4);

        res.render('userHome', { user, latestProducts });
    } catch (error) {
        console.error('Error in loadHome:', error);
        res.redirect('/user/login');
    }
};

const handleRefreshToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies
    //console.log(cookie); 
    if (!cookie?.refreshToken) throw new Error("no refresh token in cookie")
    const refreshToken = cookie.refreshToken
    //console.log(refreshToken);
    const user = await User.findOne({ refreshToken })
    if (!user) throw new Error("no refresh token in db")
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err || user.id !== decoded.id) {
            throw new Error("something wrong withrefresh token")
        }
        const accessToken = generateToken(user?._id)
        res.json({ accessToken })
    })
})

/*const getaUser = asyncHandler(async (req, res) => {//get a user
    const { id } = req.params
    try {
        const getaUser = await User.findById(id)
        res.render("userHome", { getaUser })
    } catch (error) {
        throw new Error(error)
    }
})*/

const logout = asyncHandler(async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');

        res.clearCookie('connect.sid');
        res.redirect('/user/login');
    });
});

const updateUserPage = asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.user.userId)
    try {
        res.render("userEditProfile", { user })
    } catch (error) {
        console.log(error.message)
    }
})

const updateProfile = asyncHandler(async (req, res) => {//update user

    const { id } = req.params
    try {
        const updatedUser = await User.findByIdAndUpdate({ _id: id }, {
            $set: {
                name: req.body.name,
                email: req.body.email,
                mobile: req.body.mobile
            }
        }, {
            new: true
        })

        res.redirect("/user/profile")
    } catch (error) {
        res.render("SomethingWentwrong")
    }
})

///////////////////////////////////////////////user address and payment///////////////////////////////////////////////////////////////////////////////////////////////////////

/*const buyProduct = asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.user.userId).populate('address');

    if (!user || !user.address || user.address.length === 0) {
        return res.redirect('/api/user/add-address');
    }
    const productId = req.params.productId;
    res.redirect(`/api/user/order/${productId}`);
});*/

const buyProduct = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.session.user.userId).populate('address');

        if (!user || !user.address || user.address.length === 0) {
            return res.redirect('/user/add-address');
        }

        const productId = req.params.productId;
        const couponCode = req.body.couponCode;

        let discount = 0;

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, expirationDate: { $gte: new Date() } });

            if (coupon) {
                const product = await Product.findById(productId);

                if (product) {
                    const productPrice = product.price;
                    discount = (coupon.discountPercentage / 100) * productPrice;
                } else {
                    return res.render("SomethingWentwrong");
                }
            }
        }
        res.redirect(`/user/order/${productId}`);
    } catch (error) {
        console.error(error);
        res.render("SomethingWentwrong");
    }
});



const addAddressLoad = async (req, res) => {
    try {
        res.render("userAddAddress");
    } catch (error) {
        res.render("userAddAddress", { message })
    }
};

const addAddress = async (req, res) => {
    try {
        const { country, state, district, city, street, housename, pincode } = req.body;

        const newAddress = new Address({
            user: req.session.user.userId,
            country,
            state,
            district,
            city,
            street,
            housename,
            pincode,
        });

        const savedAddress = await newAddress.save();

        const user = await User.findById(req.session.user.userId);

        user.address = savedAddress._id;

        await user.save({ validateBeforeSave: false });

        res.redirect('/user/profile');
    } catch (error) {
        console.log(error.message);
        res.render("userAddAddress", { message })
    }
};

const ProfileaddAddressLoad = async (req, res) => {
    try {
        res.render("profileAddAddress");
    } catch (error) {
        res.render("SomethingWentwrong")
    }
};

const profileAddAddress = async (req, res) => {
    try {
        const { country, state, district, city, street, housename, pincode } = req.body;

        const newAddress = new Address({
            user: req.session.user.userId,
            country,
            state,
            district,
            city,
            street,
            housename,
            pincode,
        });

        const savedAddress = await newAddress.save();

        const user = await User.findById(req.session.user.userId);

        user.address = savedAddress._id;

        await user.save({ validateBeforeSave: false });

        res.redirect('/user/profile');
    } catch (error) {
        console.log(error.message);
        res.render("profileAddAddress", { message })
    }
};


const paymentPage = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (id) {
            const product = await Product.findById(id);

            if (!product) {
                return res.status(404).render('error', { message: 'Product not found' });
            }

            const categoryOffer = await CategoryOffer.findOne({ category: product.category });
            const offerPrice = categoryOffer ? calculateDiscountedPrice(product.price, categoryOffer.offerPercentage) : null;

            const totalAmount = product.price;
            const discountedPrice = null;
            const user = await User.findById(req.session.user.userId).populate('address');

            if (!user) {
                res.render("SomethingWentwrong");
            }
            const message = null
            let orderSuccess = null
            res.render('buyProduct', { user, product, totalAmount, discountedPrice, offerPrice, message, orderSuccess });
        } else {
            const userId = req.session.user ? req.session.user.userId : null;

            if (!userId) {
                res.render("SomethingWentwrong");
            }

            const user = await User.findById(userId).populate('address');

            if (!user || !user.cart || user.cart.length === 0) {
                res.render("SomethingWentwrong");
            }

            const totalAmount = user.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const categoryOffer = null; // Update this if you have a logic to determine categoryOffer for the entire cart

            res.render('buyCart', { user, cart: user.cart, totalAmount, offerPrice: categoryOffer ? calculateDiscountedPrice(totalAmount, categoryOffer.offerPercentage) : null });
        }
    } catch (error) {
        console.log(error.message);
        res.render("SomethingWentwrong");
    }
});


const buyCartPage = asyncHandler(async (req, res) => {
    //const  shippingCharge = req.body.shippingCharge
    //console.log("shippincharge:",shippingCharge);
    try {
        const user = await User.findById(req.session.user.userId)
            .populate({
                path: 'cart.product',
                select: 'title images price',
            })
            .populate('address');

        if (!user) {
            res.render('SomethingWentwrong');
        }

        if (!user.address || user.address.length === 0) {
            return res.redirect('/user/add-address');
        }

        const appliedCoupon = req.session.appliedCoupon;

        const Amount = calculateTotalAmount(user.cart, appliedCoupon);
        const shippingCharge = Amount < 100 ? 20 : 0;
        const totalAmount = Number(Amount) + Number(shippingCharge)


        res.render('buyCart', { user, cart: user.cart, totalAmount, discountedPrice: appliedCoupon ? appliedCoupon.discountedPrice : 0, shippingCharge, Amount });
    } catch (error) {
        console.error(error);
        res.render('SomethingWentwrong');
    }
});




const calculateTotalAmount = (cart) => {
    return cart.reduce((total, item) => total + (item.discountedPrice || item.price), 0);
};


/*const orderFromCart = asyncHandler(async (req, res) => {
    try {
        const userId = req.session.user.userId;

        const user = await User.findById(userId).populate({
            path: 'cart.product',
            select: 'title images',
        });

        const order = new Order({
            user: userId,
            products: user.cart.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                title: item.product.title,
                price: item.price,
                images: item.product.images,
            })),
            totalAmount: calculateTotalAmount(user.cart), 
            paymentMethod: 'COD',
        });

        console.log('Before order creation:', user.orders);
        
        await order.save();
        
        user.cart = [];
        user.orders.push(order._id);
        
        await user.save({ validateBeforeSave: false });

        console.log('After order creation:', user.orders);

        //res.redirect(`/api/product/get-cart-items`);
        res.render("orderSuccess")
    } catch (error) {
        console.error(error);
        res.render("SomethingWentwrong")
    }
});*/

const orderFromCart = asyncHandler(async (req, res) => {
    try {
        const userId = req.session.user.userId;

        const user = await User.findById(userId).populate({
            path: 'cart.product',
            select: 'title images quantity', // Include the 'quantity' field for the product
        });

        const appliedCoupon = req.session.appliedCoupon;
        const discountedPrice = req.body.discountedPrice || 0; // Default to 0 if not provided

        // Create an array to store promises for updating product quantities
        const updateProductQuantities = [];

        const orderProducts = user.cart.map(item => {
            // Create a promise to update the product quantity
            const updateQuantityPromise = Product.findByIdAndUpdate(item.product._id, {
                $inc: { quantity: -item.quantity }, // Decrement product quantity
            });

            updateProductQuantities.push(updateQuantityPromise);

            return {
                product: item.product._id,
                quantity: item.quantity,
                title: item.product.title,
                price: item.price, // Use the discounted price here
                images: item.product.images,
                Istatus: "ordered",
            };
        });

        // Wait for all product quantity update promises to complete
        await Promise.all(updateProductQuantities);

        const order = new Order({
            user: userId,
            products: orderProducts,
            totalAmount: discountedPrice, // Use the discounted price for totalAmount
            paymentMethod: 'COD',
            coupon: appliedCoupon ? appliedCoupon.code : null,
        });

        console.log('Before order creation:', user.orders);
        order.invoicePath = await generatePDFInvoice(order);
        await order.save();

        user.cart = [];
        user.orders.push(order._id);

        await user.save({ validateBeforeSave: false });

        console.log('After order creation:', user.orders);

        res.render("orderSuccess", { orderId: order._id, invoicePath: order.invoicePath });
    } catch (error) {
        console.error(error);
        res.render("SomethingWentwrong");
    }
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

/*const orderProduct = asyncHandler(async (req, res) => {
    try {
        const userId = req.session.user.userId;
        const productId = req.query.productId;

        if (!productId) {
            return res.status(400).render('error', { message: 'Product ID is required' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).render('error', { message: 'User not found' });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).render('error', { message: 'Product not found' });
        }

        const appliedCoupon = req.session.appliedCoupon;
        console.log("discounted price after applying coupon", appliedCoupon);
        const totalAmount = appliedCoupon ? appliedCoupon.discountedPrice : product.price;

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
            paymentMethod: 'COD',
        });

        console.log('Before order creation:', user.orders);

        await order.save();

        user.orders.push(order._id);
        const invoicePath = await generatePDFInvoice(order);

        delete req.session.discountedPrice;

        await user.save({ validateBeforeSave: false });
        console.log('After order creation:', user.orders);

        res.render("orderSuccess", { orderId: order._id, invoicePath });
    } catch (error) {
        console.error(error);
        res.render("SomethingWentwrong");
    }
});
*/
const orderProduct = asyncHandler(async (req, res) => {
    try {
        const userId = req.session.user.userId;
        const productId = req.query.productId;

        if (!productId) {
            return res.status(400).render('error', { message: 'Product ID is required' });
        }

        const user = await User.findById(userId);

        if (!user) {
            res.render("SomethingWentwrong");
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).render('error', { message: 'Product not found' });
        }

        const couponDiscount = req.session.appliedCoupon ? req.session.appliedCoupon.discountedPrice : null;
        const categoryOffer = await CategoryOffer.findOne({ category: product.category });

        const totalAmount = couponDiscount || (categoryOffer ? calculateDiscountedPrice(product.price, categoryOffer.offerPercentage) : product.price);
        console.log("category offer:", categoryOffer);
        console.log("total amount:", totalAmount);

        // Decrease product quantity in the database
        if (product.quantity > 0) {
            product.quantity -= 1;
            await product.save();
        } else {
            // Handle the case where the product is out of stock
            return res.status(400).render('error', { message: 'Product is out of stock' });
        }

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
            paymentMethod: 'COD',
        });
        order.invoicePath = await generatePDFInvoice(order);
        await order.save();

        user.orders.push(order._id);

        delete req.session.discountedPrice;

        await user.save({ validateBeforeSave: false });
        console.log("order id:", order._id);
        console.log("invoice path:", order.invoicePath); // Corrected line

        res.render("orderSuccess", { orderId: order._id, invoicePath: order.invoicePath });
    } catch (error) {
        console.error(error);
        res.render("SomethingWentwrong");
    }
});





const editAddressPage = async (req, res) => {
    try {
        const { addressId } = req.params;
        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).render('error', { message: 'Address not found' });
        }

        res.render('userEditAddress', { address });
    } catch (error) {
        console.error(error);
        res.render("userEditAddress", { message })
    }
};

const productEditAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { country, state, district, city, street, housename, pincode } = req.body;

        await Address.findByIdAndUpdate(addressId, {
            country,
            state,
            district,
            city,
            street,
            housename,
            pincode,
        });

        res.redirect('/user/order/:id');
    } catch (error) {
        console.error(error);
        res.render("userEditAddress", { message })

    }
}

const cartEditAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { country, state, district, city, street, housename, pincode } = req.body;

        await Address.findByIdAndUpdate(addressId, {
            country,
            state,
            district,
            city,
            street,
            housename,
            pincode,
        });

        res.redirect('/user/cartorder?');
    } catch (error) {
        console.error(error);
        res.render("userEditAddress", { message })

    }
}

const userProfile = asyncHandler(async (req, res) => {
    try {
        const userId = req.session.user.userId
        const user = await User.findById(userId)
            .populate({
                path: 'orders',
                populate: {
                    path: 'products.product',
                    model: 'Product'
                }
            })
            .populate('address');
        const userWallet = await Wallet.findOne({ user: userId });
        const walletBalance = userWallet ? userWallet.balance : 0;
        //console.log("user in profile :", user);
        res.render('userProfile', { user, walletBalance });
    } catch (error) {
        console.error(error);
        res.render("SomethingWentwrong")
    }
});

const EditAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { country, state, district, city, street, housename, pincode } = req.body;

        await Address.findByIdAndUpdate(addressId, {
            country,
            state,
            district,
            city,
            street,
            housename,
            pincode,
        });

        res.redirect('/user/profile');
    } catch (error) {
        console.error(error);
        res.render("userEditAddress", { message })
    }
}

const changePasswordPage = asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.user.userId)
    res.render('changePassword', { user });
});

const changePassword = asyncHandler(async (req, res) => {
    const userId = req.session.user.userId;
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.render("resetPassword", { message: "Password and confirm password should be the same" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
        { _id: userId },
        { $set: { password: hashedPassword } },
        { new: true }
    );

    if (!user) {
        res.render("SomethingWentwrong")
    }

    res.redirect("/user/profile");
});

const cancelOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.session.user.userId
    const user = await User.findById(userId)
    try {
        const order = await Order.findById(orderId)
            .populate('products.product')
            .populate('paymentMethod');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentMethod === 'COD') {
            order.status = 'Cancelled';
            await order.save();
        } else if (order.paymentMethod === 'Wallet' || order.paymentMethod === 'Online') {
            const price = order.products.map(product => Array.isArray(product.price) ? product.price[0] : product.price);
            console.log("price:", price);
            const wallet = await Wallet.findOne({ user: userId });

            if (wallet) {
                const refundAmount = price.reduce((total, amount) => total + amount, 0);
                wallet.balance = Number(wallet.balance) + Number(refundAmount);
                await wallet.save();
            } else {
                const newWallet = new Wallet({
                    user: userId,
                    balance: refundAmount,
                });
                await newWallet.save();
                user.wallet = newWallet._id;
                await user.save({ validateBeforeSave: false });
            }
            order.status = 'Cancelled';
            await order.save();

        }
        res.redirect('/user/profile');
    } catch (error) {
        console.error(error);
        res.render("SomethingWentwrong");
    }
});



const sessionExpired = asyncHandler(async (req, res) => {
    res.render("SomethingWentwrong")
})

const loadReturnPage = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const user = await User.findById(req.session.user.userId)
    const order = await Order.findById(orderId).populate('products.product');


    try {
        res.render("userReturnProduct", { user, order })
    } catch (error) {
        res.render("SomethingWentwrong")
    }
})

const returnProduct = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { reason, productId } = req.body;
    const images = req.files.map((file) => file.filename);

    try {
        const order = await Order.findById(orderId).populate('products.product');
        const user = await User.findById(req.session.user.userId);

        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        // Find the selected product in the order
        const selectedProduct = order.products.find(product => product.product._id.toString() === productId);

        if (!selectedProduct) {
            return res.status(404).render('error', { message: 'Selected product not found in the order' });
        }

        if (reason === 'damaged') {
            order.isDamaged = true;
        }

        const PReturn = new Return({
            user: user,
            order: orderId,
            product: selectedProduct.product._id,
            reason,
            images,
        });

        await PReturn.save();

        //order.status = 'Requested Return';
        selectedProduct.Istatus = 'Requested Return'
        await order.save();

        await user.save({ validateBeforeSave: false });

        res.redirect('/user/profile');
    } catch (error) {
        console.error(error);
        res.render('SomethingWentwrong');
    }
});


const userViewCoupons = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.session.user.userId)
        const coupons = await Coupon.find();
        res.render('userViewCoupon', { coupons, user });
    } catch (error) {
        console.error(error);
        res.render('SomethingWentWrong');
    }
});



const applyCoupon = asyncHandler(async (req, res) => {
    try {
        const { productId, couponCode } = req.body;
        const user = await User.findById(req.session.user.userId).populate('address').populate('appliedCoupons');

        console.log('Received couponCode:', couponCode);

        if (couponCode) {
            const product = await Product.findById(productId);
            const totalAmount = product.price;
            let discountedPrice = null;  // Initialize discountedPrice

            const coupon = await Coupon.findOne({ code: couponCode, expirationDate: { $gte: new Date() } });

            console.log('Found coupon:', coupon);

            if (coupon) {
                const hasAppliedCoupon = user.appliedCoupons.some(appliedCoupon => appliedCoupon.equals(coupon._id));
                console.log('Total Amount:', totalAmount);
                console.log('Minimum Purchase Amount:', coupon.minimumPurchase);

                if (hasAppliedCoupon) {
                    console.log('Coupon already applied by the user');
                    const message = 'Coupon already used';
                    return res.render('buyProduct', { user, product, totalAmount, discountedPrice, offerPrice: null, message });
                }

                if (totalAmount >= coupon.minimumPurchase) {
                    discountedPrice = product.price - (coupon.discountPercentage / 100) * product.price;
                    console.log("percentage discount :", discountedPrice);
                    const maxdiscountAmount = product.price - coupon.maxdiscount
                    console.log("max discount result:", maxdiscountAmount);
                    if (discountedPrice < maxdiscountAmount) {
                        discountedPrice = maxdiscountAmount;
                    }
                    console.log("after checking:", discountedPrice);

                    req.session.appliedCoupon = {
                        code: coupon.code,
                        discountPercentage: coupon.discountPercentage,
                        discountedPrice: discountedPrice,
                    };

                    user.appliedCoupons.push(coupon._id);
                    await user.save({ validateBeforeSave: false });

                    console.log('Applied Coupon:', req.session.appliedCoupon);
                    const message = 'Coupon applied';

                    coupon.usedBy.push(user._id);
                    coupon.usedAt = new Date();
                    await coupon.save()

                    //await Coupon.findByIdAndDelete(coupon._id);
                    res.render('buyProduct', { user, product, totalAmount, discountedPrice, offerPrice: null, message });
                } else {
                    console.log('Minimum purchase amount not met for the coupon.');
                    const message = 'Minimum purchase amount not met for the coupon.';
                    res.render('buyProduct', { user, product, totalAmount, discountedPrice, offerPrice: null, message });
                }
            } else {
                console.log('Coupon not found or expired');
                const message = 'Coupon expired or not available';
                res.render('buyProduct', { user, product, totalAmount, discountedPrice, offerPrice: null, message });
            }
        } else {
            res.redirect(`/user/order/${productId}`);
        }
    } catch (error) {
        console.error('Error in applyCoupon:', error);
        res.render('SomethingWentWrong');
    }
});


const applyCouponToCart = asyncHandler(async (req, res) => {
    try {
        const { couponCode, productId } = req.body;
        const user = await User.findById(req.session.user.userId)
            .populate({
                path: 'cart.product',
                model: 'Product',
            })
            .populate('address')
            .populate('appliedCoupons');

        if (couponCode) {
            const appliedCoupon = await Coupon.findOne({ code: couponCode, expirationDate: { $gte: new Date() } });

            if (appliedCoupon) {

                const hasAppliedCoupon = user.appliedCoupons.some(applied => applied.equals(appliedCoupon._id));

                if (hasAppliedCoupon) {
                    
                    const message = 'Coupon already used';
                    let Amount = calculateTotalAmount(user.cart);
                    const shippingCharge = Amount < 100 ? 20 : 0;
                     const totalAmount = Number(Amount) + Number(shippingCharge)
                     console.log('Coupon already applied by the user');
                    return res.render('buyCart', { user, cart: user.cart, totalAmount, discountedPrice: req.session.discountedTotalAmount, Amount, message,shippingCharge });
                }

                const totalOriginalAmount = calculateTotalAmount(user.cart);
                console.log("original total amount:", totalOriginalAmount);

                const totalDiscountedAmount = totalOriginalAmount - (totalOriginalAmount * appliedCoupon.discountPercentage / 100);
                console.log("discounted total amount:", totalDiscountedAmount);

                let finalDiscountedPrice = totalDiscountedAmount;
                console.log("percentage discount:", finalDiscountedPrice);
                let maxdiscountAmount = totalOriginalAmount - appliedCoupon.maxdiscount
                console.log("max discount result :", maxdiscountAmount);
                if (finalDiscountedPrice < maxdiscountAmount) {
                    finalDiscountedPrice = (totalOriginalAmount - appliedCoupon.maxdiscount);
                }

                console.log("final amount:", finalDiscountedPrice);

                req.session.appliedCoupon = {
                    code: appliedCoupon.code,
                    discountPercentage: appliedCoupon.discountPercentage,
                    discountedPrice: finalDiscountedPrice,
                };

                req.session.discountedTotalAmount = finalDiscountedPrice;
                const shippingCharge = finalDiscountedPrice < 100 ? 20 : 0;
                const totalAmount = Number(finalDiscountedPrice) + Number(shippingCharge)
                // await Coupon.findByIdAndDelete(appliedCoupon._id);

                user.appliedCoupons.push(appliedCoupon._id);
                await user.save({ validateBeforeSave: false });

                appliedCoupon.usedBy.push(user._id);
                appliedCoupon.usedAt = new Date();
                await appliedCoupon.save()

                res.render('buyCart', {
                    user,
                    cart: user.cart,
                    Amount: finalDiscountedPrice,
                    totalAmount: totalAmount,
                    discountedPrice: finalDiscountedPrice,
                    shippingCharge
                    //displayedAmount: totalOriginalAmount - finalDiscountedPrice, // Display the amount after deducting the discount
                });
            } else {
                console.log('Coupon not found or expired');
                res.render('SomethingWentWrong');
            }
        } else {
            res.redirect('/user/buy-cart');
        }
    } catch (error) {
        console.error('Error in applyCouponToCart:', error);
        res.render('SomethingWentWrong');
    }
});




/*
const applyCouponToCart = asyncHandler(async (req, res) => {
    try {
        const { couponCode, productId } = req.body;
        const product = await Product.findById(productId);
        const user = await User.findById(req.session.user.userId).populate('cart.product');

        if (couponCode) {
            const appliedCoupon = await Coupon.findOne({ code: couponCode, expirationDate: { $gte: new Date() } });
            console.log("applied coupon:", appliedCoupon);
            if (appliedCoupon) {
                console.log("user.cart before applying coupon:", user.cart);
    
                let totalDiscountedAmount = 0; // Initialize totalDiscountedAmount
    
                user.cart.forEach(item => {
                    // Calculate discounted price using discount percentage
                    const discountedPrice = item.price - (item.price * appliedCoupon.discountPercentage / 100);
    
                    // Check if the discounted amount exceeds the maximum discount
                    if (appliedCoupon.maxdiscount) {
                        item.discountedPrice = Math.min(discountedPrice, appliedCoupon.maxdiscount);
                    } else {
                        item.discountedPrice = discountedPrice;
                    }
    
                    console.log(`Original Price: ${item.price}, Discounted Price: ${item.discountedPrice}`);
    
                    totalDiscountedAmount += item.discountedPrice; // Accumulate discounted prices
                });
    
                console.log("user.cart after applying coupon:", user.cart);
                console.log("totalDiscountedAmount:", totalDiscountedAmount);
    
                // Calculate the final total amount after applying discounts
                const totalAmountAfterDiscount = user.cart.reduce((acc, item) => acc + item.price, 0) - totalDiscountedAmount;
    
                req.session.appliedCoupon = {
                    code: appliedCoupon.code,
                    discountPercentage: appliedCoupon.discountPercentage,
                    discountedPrice: totalDiscountedAmount, // Use total discounted amount for the session
                };
    
                req.session.discountedTotalAmount = req.session.appliedCoupon.discountedPrice; // Use total discounted amount for display
    
                await Coupon.findByIdAndDelete(appliedCoupon._id);
    
                res.render('buyCart', {
                    user: req.user,
                    cart: user.cart,
                    totalAmount: totalAmountAfterDiscount, // Use the final total amount for display
                    discountedPrice: req.session.appliedCoupon ? req.session.appliedCoupon.discountedPrice : 0
                });
            } else {
                console.log('Coupon not found or expired');
                res.render('SomethingWentWrong');
            }
        } else {
            res.redirect('/api/user/buy-cart');
        }
    } catch (error) {
        console.error('Error in applyCouponToCart:', error);
        res.render('SomethingWentWrong');
    }
});
*/



const orderProductWithWallet = asyncHandler(async (req, res) => {
    try {
        const productId = req.body.productId;
        const user = await User.findById(req.session.user.userId).populate('wallet');

        if (!user) {
            return res.render("SomethingWentwrong");
        }

        const product = await Product.findById(productId);
        let totalAmount;

        console.log("req.session.appliedCoupon:", req.session.appliedCoupon);

        if (req.session.appliedCoupon) {
            console.log("Coupon discount applied:", req.session.appliedCoupon.discountedPrice);
            totalAmount = req.session.appliedCoupon.discountedPrice;
        } else {
            const categoryOffer = await CategoryOffer.findOne({ category: product.category });
            console.log("Category offer:", categoryOffer);
            totalAmount = categoryOffer ? calculateDiscountedPrice(product.price, categoryOffer.offerPercentage) : product.price;
        }

        console.log("Calculated total amount:", totalAmount);
        const categoryOffer = await CategoryOffer.findOne({ category: product.category });
        const offerPrice = categoryOffer ? calculateDiscountedPrice(product.price, categoryOffer.offerPercentage) : null;
        if (user.wallet.balance < totalAmount) {
            let discountedPrice= null
            console.log("low balance:",user.wallet.balance);
            return res.render('buyProduct', { user, product, totalAmount, message: "Insufficient balance" ,discountedPrice,offerPrice});
        }

        // Decrease product quantity in the database
        if (product.quantity > 0) {
            product.quantity -= 1;
            await product.save();
        } else {
            // Handle the case where the product is out of stock
            return res.render('error', { message: 'Product is out of stock' });
        }

        const debitTransaction = new Transaction({
            user: user._id,
            amount: totalAmount,
            type: 'debit',
        });
        await debitTransaction.save();

        user.wallet.balance -= totalAmount;
        await user.wallet.save();

        const order = new Order({
            user: user._id,
            products: [
                {
                    product: product._id,
                    quantity: 1,
                    title: product.title,
                    price: totalAmount,
                    images: product.images,
                }
            ],
            totalAmount: totalAmount,
            paymentMethod: 'Wallet',
        });
        order.invoicePath = await generatePDFInvoice(order);

        await order.save();
        user.orders.push(order._id);
        await user.save({ validateBeforeSave: false });


        res.render("orderSuccess", { orderId: order._id, invoicePath: order.invoicePath });
    } catch (error) {
        console.error('Error placing order with wallet:', error);
        res.render("SomethingWentwrong");
    }
});

const renderSuccess = asyncHandler(async (req, res) => {
    try {
        res.render("orderSuccess");
    } catch (error) {
        res.render("SomethingWentwrong");

    }
})

const orderFromCartWithWallet = asyncHandler(async (req, res) => {
    try {
        const userId = req.session.user.userId;
        const user = await User.findById(userId).populate({
            path: 'cart.product',
            select: 'title images quantity', // Include the 'quantity' field for the product
        });

        if (!user) {
            res.render("SomethingWentwrong");
        }

        const Amount = req.body.totalAmount
        const shippingCharge = Amount < 100 ? 20 : 0;
        const totalAmount = Number(Amount) + Number(shippingCharge)
        const appliedCoupon = req.session.appliedCoupon;
        const wallet = await Wallet.findOne({ user: userId });

        if (!wallet || wallet.balance < totalAmount) {
            res.render('buyCart', { user, cart: user.cart, totalAmount, discountedPrice: appliedCoupon ? appliedCoupon.discountedPrice : 0, message: "insufficient balance",Amount,shippingCharge });
        }

        // Create an array to store promises for updating product quantities
        const updateProductQuantities = [];

        const orderProducts = user.cart.map(item => {
            // Create a promise to update the product quantity
            const updateQuantityPromise = Product.findByIdAndUpdate(item.product._id, {
                $inc: { quantity: -item.quantity }, // Decrement product quantity
            });

            updateProductQuantities.push(updateQuantityPromise);

            return {
                product: item.product._id,
                quantity: item.quantity,
                title: item.product.title,
                price: item.price,
                images: item.product.images,
                Istatus: "ordered",
            };
        });

        // Wait for all product quantity update promises to complete
        await Promise.all(updateProductQuantities);

        const order = new Order({
            user: userId,
            products: orderProducts,
            totalAmount: totalAmount,
            paymentMethod: 'Wallet',
        });
        order.invoicePath = await generatePDFInvoice(order);

        await order.save();

        const debitTransaction = new Transaction({
            user: user._id,
            amount: totalAmount,
            type: 'debit',
        });

        await debitTransaction.save();

        wallet.balance -= totalAmount;
        await wallet.save();

        user.cart = [];
        user.orders.push(order._id);
        await user.save({ validateBeforeSave: false });

        res.render("orderSuccess", { orderId: order._id, invoicePath: order.invoicePath });
    } catch (error) {
        console.error('Error placing order with wallet:', error);
        res.render("SomethingWentwrong");
    }
});

const getWalletTransactions = asyncHandler(async (req, res) => {
    try {
        const userId = req.session.user.userId;
        const user = await User.findById(userId)
        const userWallet = await Wallet.findOne({ user: userId });
        const walletBalance = userWallet ? userWallet.balance : 0;
        const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 });

        res.render("walletTransactions", { user, walletBalance, transactions });
    } catch (error) {
        console.error('Error fetching wallet transactions:', error);
        res.render("SomethingWentwrong");
    }
});

const generatePDFInvoice = async (order) => {
    const pdfDoc = new PDFDocument();
    const orderId = order._id;

    const rootDir = path.join(__dirname, '..');
    const invoicePath = path.join(__dirname, '..', 'invoices', `invoice_${orderId}.pdf`);
    const Timestamp = new Date();
    pdfDoc.pipe(fs.createWriteStream(invoicePath));

    // Add header
    pdfDoc.fontSize(18).text('SHOPPIEE-E', { align: 'center' });
    pdfDoc.fontSize(16).text('Invoice', { align: 'center' });

    // Fetch user details
    const user = await User.findById(order.user).populate('address');

    if (user) {
        // Add user details
        pdfDoc.fontSize(12).text(`Name: ${user.name}`);

        if (Array.isArray(user.address) && user.address.length > 0) {
            const address = user.address[0];
            const formattedAddress = `${address.housename}, ${address.street},${address.city}, ${address.district}, 
 ${address.state}, ${address.country},${address.pincode}`;

            pdfDoc.fontSize(12).text(`Address: ${formattedAddress}`);
        } else if (user.address) {
            const formattedAddress = `${user.address.housename}, ${user.address.street}, ${user.address.city}, ${user.address.district}, ${user.address.state}, ${user.address.country}, ${user.address.pincode}`;
            pdfDoc.fontSize(12).text(`Address: ${formattedAddress}`);
        } else {
            pdfDoc.fontSize(12).text('User has no address information');
        }
    } else {
        pdfDoc.fontSize(12).text('User not found');
    }
    pdfDoc.moveDown().lineTo(50, pdfDoc.y).lineTo(pdfDoc.page.width - 50, pdfDoc.y).stroke().moveDown();
    pdfDoc.moveDown();
    pdfDoc.fontSize(12).text(`Product Details:`);
    pdfDoc.moveDown();

    for (const productOrder of order.products) {
        const product = await Product.findById(productOrder.product);
        if (product) {
            pdfDoc.fontSize(12).text(`Quantity                Product                 Price`);
            pdfDoc.fontSize(10).text(`      ${productOrder.quantity}                   ${product.title}                 ${productOrder.price}rupees`);
        }
    }
    pdfDoc.moveDown();

    // Add total amount
    pdfDoc.fontSize(11).text(`Date of order: ${Timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    pdfDoc.fontSize(11).text(` Payment method: ${order.paymentMethod}`, { align: 'left' });



    pdfDoc.moveDown();

    // Add ordered at date if createdAt is defined
    console.log("Order object:", order);
    console.log("order date:", Timestamp);

    pdfDoc.fontSize(14).text(`Total Amount: ${order.totalAmount} rupees`, { align: 'left' });


    // Add space between lines
    pdfDoc.moveDown(2);

    pdfDoc.end();

    return invoicePath;
};


/*
const generatePDFInvoice = async (order) => {
    const pdfDoc = new PDFDocument();
    const orderId = order._id;

    const rootDir = path.join(__dirname, '..');
    const invoicePath = path.join(__dirname, '..', 'invoices', `invoice_${orderId}.pdf`);
    const Timestamp = new Date();
    pdfDoc.pipe(fs.createWriteStream(invoicePath));

    // Add header
    pdfDoc.fontSize(18).text('SHOPPIEE-E', { align: 'center' });
    pdfDoc.fontSize(16).text('Invoice', { align: 'center' });

    // Fetch user details
    const user = await User.findById(order.user).populate('address');

    let formattedAddress = ''; // Declare it outside the if (user) block

    if (user) {
        // Add user details
        pdfDoc.fontSize(12).text(`User: ${user.name}`);

        if (Array.isArray(user.address) && user.address.length > 0) {
            const address = user.address[0];
            formattedAddress = `${address.housename}, ${address.street}, ${address.city}, ${address.district}, ${address.state}, ${address.country}, ${address.pincode}`;
        } else if (user.address) {
            formattedAddress = `${user.address.housename}, ${user.address.street}, ${user.address.city}, ${user.address.district}, ${user.address.state}, ${user.address.country}, ${user.address.pincode}`;
        } else {
            formattedAddress = 'User has no address information';
        }
    } else {
        pdfDoc.fontSize(12).text('User not found');
    }

    // Now you can use formattedAddress outside the if (user) block
    pdfDoc.fontSize(12).text(`User Address: ${formattedAddress}`);


    // Add product details in a table
    const items = [];
    for (const productOrder of order.products) {
        const product = await Product.findById(productOrder.product);
        if (product) {
            items.push({
                quantity: productOrder.quantity,
                description: product.title,
                price: productOrder.price,
                tax: 0, // You may need to adjust this based on your requirements
            });
        }
    }

    const data = {
        documentTitle: 'Invoice',
        currency: 'rupees',
        taxNotation: 'GST',
        marginTop: 25,
        marginRight: 25,
        marginLeft: 25,
        marginBottom: 25,
        logo: 'path/to/logo.png', // Add your logo path
        sender: {
            company: 'SHOPPIEE-E',
            address: 'Your Address',
            zip: 'ZIP',
            city: 'City',
            country: 'Country',
        },
        client: {
            name: user.name,
            address: formattedAddress,
        },
        invoiceNumber: `Invoice ${orderId}`,
        invoiceDate: Timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        products: items,
        bottomNotice: `Total Amount: ${order.totalAmount} rupees`,
    };

    const result = await generatePDFInvoice(data);
    const pdfBuffer = Buffer.from(result.pdf, 'base64');

    fs.writeFileSync(invoicePath, pdfBuffer);

    pdfDoc.moveDown();

    // Add ordered at date if createdAt is defined
    console.log("Order object:", order);
    console.log("order date:", Timestamp);

    pdfDoc.fontSize(12).text(`Ordered At: ${Timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);

    // Add space between lines
    pdfDoc.moveDown(2);

    pdfDoc.end();

    return invoicePath;
};
*/

const downloadInvoice = async (req, res) => {
    try {
        const userId = req.session.user.userId;
        const orderId = req.params.orderId;

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order || !order.invoicePath) {
            res.status(404).render('error', { message: 'Invoice not found' });
            return;
        }

        const invoicePath = order.invoicePath;

        const fullPath = path.resolve(invoicePath);

        try {
            await fs.promises.access(fullPath);
        } catch (error) {
            res.status(404).render('error', { message: 'Invoice file not found' });
            return;
        }

        const stat = fs.statSync(fullPath);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);

        const invoiceStream = fs.createReadStream(fullPath);
        invoiceStream.pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
}





module.exports = {
    loadRegister, signupUser,
    resendOtp, handleRefreshToken, verifyOtp, loadVerify,
    loginLoad, loginUserCtrl,
    forgotPasswordLoad,
    forgotPassword,
    resetPasswordLoad,
    resetPassword,
    loadHome,
    logout,
    buyProduct,
    addAddressLoad,
    addAddress,
    paymentPage,
    buyCartPage, orderFromCart, orderProduct, applyCoupon, applyCouponToCart,
    editAddressPage, productEditAddress, cartEditAddress,
    userProfile, EditAddress, updateUserPage, updateProfile, changePassword, changePasswordPage,
    cancelOrder, sessionExpired, ProfileaddAddressLoad, profileAddAddress, userViewCoupons, loadReturnPage, returnProduct,
    orderProductWithWallet, orderFromCartWithWallet, getWalletTransactions, generatePDFInvoice, downloadInvoice, calculateDiscountedPrice,
    calculateTotalAmount, renderSuccess
}
