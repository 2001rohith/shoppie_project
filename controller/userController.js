const User = require("../models/userModel")
const Address = require("../models/addressModel")
const Product = require("../models/productModel")
const Order = require("../models/orderModel")
const asyncHandler = require("express-async-handler")
const { generateToken } = require("../config/jwtToken")
const jwt = require("jsonwebtoken")
const generateOTP = require("../services/generateOtp")
const sendEmail = require("../services/emailotp")
const { generateResetToken, verifyResetToken } = require("../services/resetToken");
const bcrypt = require("bcrypt")


const loadRegister = async (req, res) => {
    try {
        let errors
        res.render("signup", { errors })
    } catch (error) {
        console.log(error.message)
    }
}
const signupUser = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const { password, confirmPassword } = req.body
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
                await User.create({ ...req.body, otp, isVerified: false });
            } else {
                await User.updateOne({ email }, { $set: { ...req.body, otp, isVerified: false } });
            }

            await sendEmail(email, 'Verify Your Email', `Your OTP: ${otp}`);
            
            res.redirect(`/api/user/verify-otp/${email}`);
        } else {
            throw new Error('User already exists and is verified');
        }
    } catch (error) {
        if (error.errors) {
            const errors = Object.values(error.errors).map(err => err.message);
            res.render('signup', { errors });
        }

        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            let errors;
            const errorMessage = 'Email address is already in use.';
            res.status(400).render('signup', { errors, message: errorMessage });
        } else {
            let errors
            console.error('Error during registration:', error);
            res.render('signup', { errors, message: 'Registration failed. Please try again.' });
        }

    }
});

const loadVerify = asyncHandler(async (req, res) => {
    try {
        const email = req.params.id
        console.log(req.params.id);
        //console.log("hi");
        res.render("otpverify", { email })
    } catch (error) {
        console.log(error.message);
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
            throw new Error('Invalid request for OTP resend')
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
                res.redirect('/api/user/login');
            } else {
                res.render("otpverify", { email, message: "Otp expired" })
            }
        } else {
            throw new Error('Invalid OTP or user is already verified');
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


        return res.redirect("/api/user/home");
    }

    res.render("login", { message: "Wrong password or email" });
});

const forgotPasswordLoad = async (req, res) => {
    try {
        res.render("forgotPassword");
    } catch (error) {
        console.log(error.message);
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
        const resetUrl = `${req.protocol}://${req.get("host")}/api/user/reset-password/${resetToken}`;
        const message = `Forgot your password? Click here : ${resetUrl}.`;

        await sendEmail(user.email, "Your password reset token (valid for 10 minutes)", message);

        res.render("forgotPassword", { message: "Password reset email sent" });
    } catch (error) {
        console.log(error.message);
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
        console.log(error.message);
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
        res.redirect("/api/user/login");
    } catch (error) {
        console.log(error.message);
    }
};

const loadHome = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.userId.toString());

        console.log('User data in loadHome:', user);
        if (!user) {
            return res.redirect('/api/user/login');
        }
        res.render('userHome', { user });
    } catch (error) {
       res.redirect('/api/user/login')
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
        res.redirect('/api/user/login');
    });
});

const updateUserPage = asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.user.userId)
    try {
        res.render("userEditProfile",{user})
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
        
        res.redirect("/api/user/profile")
    } catch (error) {
        res.render("SomethingWentwrong")
    }
})

///////////////////////////////////////////////user address and payment///////////////////////////////////////////////////////////////////////////////////////////////////////

const buyProduct = asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.user.userId).populate('address');

    if (!user || !user.address || user.address.length === 0) {
        return res.redirect('/api/user/add-address');
    }
    const productId = req.params.productId;
    res.redirect(`/api/user/order/${productId}`);
});

const addAddressLoad = async (req, res) => {
    try {
        res.render("userAddAddress");
    } catch (error) {
        res.render("userAddAddress",{message})
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

        res.redirect('/api/product/allproducts');
    } catch (error) {
        console.log(error.message);
        res.render("userAddAddress",{message})
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

        res.redirect('/api/user/profile');
    } catch (error) {
        console.log(error.message);
        res.render("profileAddAddress",{message})
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

            const totalAmount = product.price;
            const user = await User.findById(req.session.user.userId).populate('address');
            console.log(user);
            
            if (!user) {
                return res.status(404).render('error', { message: 'User not found' });
            }

            res.render('buyProduct', { user, product, totalAmount });
        } else {
            const userId = req.session.user ? req.session.user.userId : null;

            if (!userId) {
                return res.status(404).render('error', { message: 'User not found' });
            }

            const user = await User.findById(userId).populate('address');

            if (!user || !user.cart || user.cart.length === 0) {
                return res.status(404).render('error', { message: 'No items in the cart' });
            }

            const totalAmount = user.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

            res.render('buyCart', { user, cart: user.cart, totalAmount });
        }
    } catch (error) {
        console.log(error.message);
        res.render("SomethingWentwrong")
    }
});

const buyCartPage = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.session.user.userId)
            .populate({
                path: 'cart.product',
                select: 'title images price',
            })
            .populate('address');

        if (!user) {
            return res.status(404).render('error', { message: 'User not found' });
        }

        if (!user.address || user.address.length === 0) {
           
            return res.redirect('/api/user/add-address');
            
        }

        const totalAmount = user.cart.reduce((total, item) => total + item.price, 0);

        res.render('buyCart', { user, cart: user.cart, totalAmount });
    } catch (error) {
        console.error(error);
        res.render('SomethingWentwrong');
    }
});


const calculateTotalAmount = (cart) => {
    return cart.reduce((total, item) => total + item.price, 0);
};

const orderFromCart = asyncHandler(async (req, res) => {
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
});

const orderProduct = asyncHandler(async (req, res) => {
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

        const order = new Order({
            user: userId,
            products: [{
                product: product._id,
                quantity: 1,
                title: product.title, 
                price: product.price,
                images: product.images,
            }],
            totalAmount: product.price,
            paymentMethod: 'COD',
        });

        console.log('Before order creation:', user.orders);

        await order.save();

        user.orders.push(order._id);

        await user.save({ validateBeforeSave: false });
        console.log('After order creation:', user.orders);

        //res.redirect(`/api/product/getproduct/${product._id}`);
        res.render("orderSuccess")
    } catch (error) {
        console.error(error);
        res.render("SomethingWentwrong")
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
        res.render("userEditAddress",{message})
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

        res.redirect('/api/user/order/:id');
    } catch (error) {
        console.error(error);
        res.render("userEditAddress",{message})

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

        res.redirect('/api/user/cartorder?');
    } catch (error) {
        console.error(error);
        res.render("userEditAddress",{message})

    }
}

const userProfile = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.session.user.userId)
            .populate({
                path: 'orders',
                populate: {
                    path: 'products.product',
                    model: 'Product'
                }
            })
            .populate('address');

        res.render('userProfile', { user });
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

        res.redirect('/api/user/profile');
    } catch (error) {
        console.error(error);
        res.render("userEditAddress",{message})
    }
}

const changePasswordPage = asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.user.userId)
    res.render('changePassword',{user});
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

    res.redirect("/api/user/profile");
});

const cancelOrder = asyncHandler(async(req,res)=>{
    const { orderId } = req.params;

   try {
      const order = await Order.findByIdAndUpdate(orderId, { $set: { status: 'Cancelled' } }, { new: true });

      if (!order) {
         return res.status(404).json({ success: false, message: 'Order not found' });
      }

      res.redirect('/api/user/profile');
   } catch (error) {
      console.error(error);
      res.render("SomethingWentwrong")
   }
})
const sessionExpired = asyncHandler(async(req,res)=>{
    res.render("SomethingWentwrong")
})






module.exports = {
    loadRegister, signupUser,
    resendOtp, handleRefreshToken,verifyOtp, loadVerify,
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
    buyCartPage, orderFromCart, orderProduct,
    editAddressPage, productEditAddress, cartEditAddress,
    userProfile,EditAddress,updateUserPage,updateProfile,changePassword,changePasswordPage,
    cancelOrder,sessionExpired,ProfileaddAddressLoad,profileAddAddress
}