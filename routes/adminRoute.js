const express = require("express")
const { loginAdminCtrl, getallUser, getaUser, createUser, deleteaUser, updatedUser, blockUser, unblockUser, handleRefreshToken, logout, adminLoginLoad, loadAdminHome,  updateUserLoad, loadCreateUser, listOrders, updateOrderStatus } = require("../controller/adminController")
const { isAdmin } = require("../middleware/authMiddleware")
const router = express.Router()

router.get("/get-orders",listOrders)
router.post("/order-status-update/:id",updateOrderStatus)

router.get("/logout",isAdmin, logout)

router.get("/login", adminLoginLoad)
router.post("/login", loginAdminCtrl)

router.get("/adminHome",isAdmin,loadAdminHome )
router.get("/all-users",isAdmin,getallUser, )
//router.get("/refresh", handleRefreshToken)



router.get("/create-user",isAdmin,loadCreateUser )
router.post("/create-user", isAdmin,createUser)

router.get("/delete-user/:id",isAdmin, deleteaUser, );

router.get("/edit-user/:id",isAdmin,updateUserLoad, )
router.post("/edit-user/:id",isAdmin, updatedUser, )

router.get("/block-user/:id",isAdmin, blockUser, )
router.get("/unblock-user/:id",isAdmin, unblockUser, )




module.exports = router