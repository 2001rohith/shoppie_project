const User = require("../models/userModel")
const Order = require("../models/orderModel")
const Coupon = require("../models/couponModel")
const asyncHandler = require("express-async-handler")
const { generateToken } = require("../config/jwtToken")
const generateRefreshToken = require("../config/refreshtoken");
const jwt = require("jsonwebtoken")
const { generateCouponCode } = require("../services/couponCodeGenerator")

const adminLoginLoad = async (req, res) => {
    try {
        res.render("adminLogin")
    } catch (error) {
        console.log(error.message)
    }
}
const loginAdminCtrl = asyncHandler(async (req, res) => {//login user
    const { email, password } = req.body
    console.log("Login request body:", req.body);
    //console.log(email,password);
    const findUser = await User.findOne({ email })

    if (findUser && await findUser.isPasswordMatched(password)) {
        const userRole = findUser.role;
        //const refreshToken = await generateRefreshToken(findUser?._id)
        const refreshToken = generateRefreshToken(findUser?._id);

        const updateuser = await User.findByIdAndUpdate(findUser.id, {
            refreshToken: refreshToken,
        }, { new: true })
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000
        })
        if (userRole == "admin") {
            res.redirect("/api/admin/adminHome")
        } else {
            res.render("adminLogin", { message: "not a admin" })
        }
    } else {
        res.render("adminLogin", { message: "invalid details" })
    }
})

const loadAdminHome = async (req, res) => {
    try {
        //const userData = await User.findById({_id:req.session.user_id})
        res.render('adminHome')
    } catch (error) {
        console.log(error.message)
    }
}

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

const updateUserLoad = asyncHandler(async (req, res) => {
    try {
        res.render("UpdateUser")
    } catch (error) {
        console.log(error.message)
    }
})
const updatedUser = asyncHandler(async (req, res) => {//update user

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
        res.render("adminUpdateUser", { message: "user updated" })
        //res.redirect("/api/admin/all-users")
    } catch (error) {
        throw new Error(error)
    }
})

const getallUser = asyncHandler(async (req, res) => {
    try {
        const searchQuery = req.query.search || "";
        const roleFilter = { role: "user" };
        const searchFilter = {};
        if (searchQuery) {
            searchFilter.$or = [
                { name: { $regex: searchQuery, $options: "i" } }, //case insensitive
                { email: { $regex: searchQuery, $options: "i" } },
            ];
        }
        const userData = await User.find({ $and: [roleFilter, searchFilter] });

        res.render("adminViewUsers", { users: userData, searchQuery });
    } catch (error) {
        throw new Error(error);
    }
});

const loadCreateUser = async (req, res) => {
    try {
        res.render("adminCreateUser")
    } catch (error) {
        console.log(error.message);
    }
}
const createUser = asyncHandler(async (req, res) => {//create user
    const email = req.body.email
    const findUser = await User.findOne({ email: email })//already exist or not
    if (!findUser) {

        const newUser = await User.create(req.body)//new user
        res.redirect("/api/admin/all-users")

    } else {

        throw new Error("user already exists")

    }

})

const deleteaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        await User.findByIdAndDelete(id);
        res.redirect("/api/admin/all-users");
    } catch (error) {
        throw new Error(error);
    }
});

const blockUser = asyncHandler(async (req, res) => {//block user
    const { id } = req.params
    try {
        const block = await User.findByIdAndUpdate(id, { isBlocked: true }, { new: true })
        res.redirect("/api/admin/all-users");
    } catch (error) {
        throw new Error(error)
    }
})

const unblockUser = asyncHandler(async (req, res) => {//unblock user
    const { id } = req.params
    try {
        const unblock = await User.findByIdAndUpdate(id, { isBlocked: false }, { new: true })
        res.redirect("/api/admin/all-users");
    } catch (error) {
        throw new Error(error)
    }
})

const logout = asyncHandler(async (req, res) => {//logout
    const cookie = req.cookies
    if (!cookie?.refreshToken) throw new Error("no refresh token")
    const refreshToken = cookie.refreshToken
    const user = await User.findOne({ refreshToken })
    if (!user) {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true
        })
        return res.sendStatus(204)//forbdn
    }
    await User.findOneAndUpdate({ refreshToken }, {
        refreshToken: "",
    })
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
    })

    res.redirect("/api/admin/login")
})

const listOrders = asyncHandler(async (req, res) => {
    try {
        const orders = await Order.find().populate('user').populate('products.product');
        res.render('adminViewOrder', { orders });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
})

const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findByIdAndUpdate(id, { $set: { status } }, { new: true });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.redirect('/api/admin/get-orders');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
})

/*const cancelOrder = asyncHandler(async(req,res)=>{
    const { orderId } = req.params;

    try {
        const order = await Order.findByIdAndUpdate(orderId, { $set: { status: 'canceled' } }, { new: true });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.redirect('/api/admin/get-orders');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
})*/

const loadCreateCoupon = asyncHandler(async(req,res)=>{
    res.render("adminCreateCoupon")
})

const createCoupon = asyncHandler(async (req, res) => {
    try {
      const { discountPercentage, expirationDate } = req.body;
      const couponCode = generateCouponCode();
  
      const coupon = await Coupon.create({
        code: couponCode,
        discountPercentage,
        expirationDate,
      });
  
      res.redirect('/api/admin/coupons');
    } catch (error) {
      console.error(error);
      res.render('adminCreateCoupon', { message: 'Coupon creation failed. Please try again.' });
    }
});

const viewCoupons = asyncHandler(async (req, res) => {
    try {
      const coupons = await Coupon.find();
      res.render('adminViewCoupons', { coupons });
    } catch (error) {
      console.error(error);
      res.render('adminViewCoupons', { message: 'Failed to fetch coupons. Please try again.' });
    }
  });



module.exports = {
    adminLoginLoad,
    loginAdminCtrl,
    loadAdminHome,
    getallUser,
    loadCreateUser,
    createUser,
    deleteaUser,
    updateUserLoad,
    updatedUser,
    blockUser,
    unblockUser,
    handleRefreshToken, listOrders, updateOrderStatus,loadCreateCoupon,createCoupon,viewCoupons,
    logout
}