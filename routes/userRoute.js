const express = require("express")
const upload = require('../config/multerConfig');
const { signupUser, loginUserCtrl, resendOtp, buyProduct, logout, loadRegister, loginLoad, loadHome, verifyOtp, loadVerify,
    forgotPasswordLoad, forgotPassword, resetPasswordLoad, resetPassword, addAddressLoad, addAddress, paymentPage, buyCartPage,
    orderFromCart, orderProduct, editAddressPage, productEditAddress, cartEditAddress, userProfile, EditAddress, updateProfile,
    updateUserPage, changePasswordPage, changePassword, cancelOrder, sessionExpired, profileAddAddress, ProfileaddAddressLoad,
    applyCoupon, userViewCoupons, returnProduct, loadReturnPage, applyCouponToCart, orderProductWithWallet, orderFromCartWithWallet, downloadInvoice, renderSuccess, getWalletTransactions } = require("../controller/userController")
const { orderProductOnline, orderFromCartOnline } = require("../controller/paymentController")
const { checkBlockedStatus } = require("../middleware/isBlockMiddleware")
const routerU = express.Router()

routerU.post("/cancel-order/:orderId", checkBlockedStatus, cancelOrder)

routerU.get("/return-product/:orderId", checkBlockedStatus, loadReturnPage)
routerU.post("/return-product/:orderId", upload.array('images'), returnProduct)

routerU.get("/change-password", checkBlockedStatus, changePasswordPage)
routerU.post("/change-password", checkBlockedStatus, changePassword)

routerU.get("/edit-profile/:id", checkBlockedStatus, updateUserPage)
routerU.post("/edit-profile/:id", checkBlockedStatus, updateProfile)

routerU.get("/session-expired", checkBlockedStatus, sessionExpired)
routerU.get("/cartorder", checkBlockedStatus, buyCartPage)
routerU.get('/order/:id', checkBlockedStatus, paymentPage);
routerU.post("/buy-product/:productId", checkBlockedStatus, buyProduct);
routerU.post('/order-product-online', checkBlockedStatus, orderProductOnline);
routerU.post("/cart-order-online", checkBlockedStatus, orderFromCartOnline)
routerU.post("/wallet-buy-product", checkBlockedStatus, orderProductWithWallet)
routerU.post("/wallet-cart-order", checkBlockedStatus, orderFromCartWithWallet)
routerU.get("/get-coupons", checkBlockedStatus, userViewCoupons)
//routerU.post('/verify-razorpay-payment', verifyRazorpayPayment);

routerU.get("/add-address", checkBlockedStatus, addAddressLoad);
routerU.post("/add-address", checkBlockedStatus, addAddress);

routerU.get("/ordersuccess",renderSuccess)
routerU.get("/profile-add-address", checkBlockedStatus, ProfileaddAddressLoad)
routerU.post("/profile-add-address", checkBlockedStatus, profileAddAddress)
routerU.post("/cart-order", checkBlockedStatus, orderFromCart)
routerU.post("/order-product", checkBlockedStatus, orderProduct)
routerU.post("/apply-coupon", checkBlockedStatus, applyCoupon)
routerU.post("/cart-apply-coupon", checkBlockedStatus, applyCouponToCart)

routerU.get("/transactions",checkBlockedStatus,getWalletTransactions)

routerU.get("/product-edit-address/:addressId", checkBlockedStatus, editAddressPage)
routerU.post("/product-edit-address/:addressId", checkBlockedStatus, productEditAddress)

routerU.get("/cart-edit-address/:addressId", checkBlockedStatus, editAddressPage)
routerU.post("/cart-edit-address/:addressId", checkBlockedStatus, cartEditAddress)

routerU.get('/profile', checkBlockedStatus, userProfile);
routerU.get("/edit-address/:addressId", checkBlockedStatus, editAddressPage)
routerU.post("/edit-address/:addressId", checkBlockedStatus, EditAddress)

routerU.get("/", loadRegister)
routerU.post("/", signupUser)
routerU.get("/verify-otp/:id", loadVerify)
routerU.post("/verify-otp", verifyOtp)
routerU.post('/resend-otp', resendOtp)

routerU.get("/login", loginLoad)
routerU.post("/login", loginUserCtrl)

routerU.get("/forgot-password", forgotPasswordLoad)
routerU.post("/forgot-password", forgotPassword)
routerU.get("/reset-password/:token", resetPasswordLoad)
routerU.post("/reset-password/:token", resetPassword)
routerU.get("/home", checkBlockedStatus, loadHome)
routerU.get("/logout", logout)
routerU.get('/download/invoice/:orderId', downloadInvoice);


module.exports = routerU
