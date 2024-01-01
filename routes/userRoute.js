const express = require("express")

const { signupUser, loginUserCtrl, resendOtp, buyProduct, logout, loadRegister, loginLoad, loadHome, verifyOtp, loadVerify, forgotPasswordLoad, forgotPassword, resetPasswordLoad, resetPassword, addAddressLoad, addAddress, paymentPage, buyCartPage, orderFromCart, orderProduct, editAddressPage, productEditAddress, cartEditAddress, userProfile, EditAddress, updateProfile, updateUserPage, changePasswordPage, changePassword, cancelOrder, sessionExpired,profileAddAddress,ProfileaddAddressLoad } = require("../controller/userController")
/*const { checkBlockedStatus } = require("../middleware/isBlockMiddleware");
const userMiddleware =  require("../middleware/userMiddleware")*/
const routerU = express.Router()


routerU.post("/cancel-order/:orderId", cancelOrder)

routerU.get("/change-password", changePasswordPage)
routerU.post("/change-password", changePassword)

routerU.get("/edit-profile/:id", updateUserPage)
routerU.post("/edit-profile/:id", updateProfile)

routerU.get("/session-expired",sessionExpired)
routerU.get("/cartorder", buyCartPage)
routerU.get('/order/:id', paymentPage);
routerU.post("/buy-product/:productId", buyProduct);
routerU.get("/add-address", addAddressLoad);
routerU.post("/add-address", addAddress);

routerU.get("/profile-add-address",ProfileaddAddressLoad)
routerU.post("/profile-add-address",profileAddAddress)
routerU.post("/cart-order", orderFromCart)
routerU.post("/order-product", orderProduct)

routerU.get("/product-edit-address/:addressId", editAddressPage)
routerU.post("/product-edit-address/:addressId", productEditAddress)

routerU.get("/cart-edit-address/:addressId", editAddressPage)
routerU.post("/cart-edit-address/:addressId", cartEditAddress)



routerU.get('/profile', userProfile);
routerU.get("/edit-address/:addressId", editAddressPage)
routerU.post("/edit-address/:addressId", EditAddress)



routerU.get("/register", loadRegister)
routerU.post("/register", signupUser)
routerU.get("/verify-otp/:id", loadVerify)
routerU.post("/verify-otp", verifyOtp)
routerU.post('/resend-otp', resendOtp)

routerU.get("/login", loginLoad)
routerU.post("/login", loginUserCtrl)

routerU.get("/forgot-password", forgotPasswordLoad)
routerU.post("/forgot-password", forgotPassword)
routerU.get("/reset-password/:token", resetPasswordLoad)
routerU.post("/reset-password/:token", resetPassword)
routerU.get("/home", loadHome)
routerU.get("/logout", logout)
//routerU.get("/refresh",handleRefreshToken)
//routerU.get("/:id", getaUser)
//routerU.put("/edit-profile", updateProfile)











module.exports = routerU