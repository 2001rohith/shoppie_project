const express = require("express")
const { loginAdminCtrl, getallUser, getaUser, createUser, deleteaUser, updatedUser, blockUser, unblockUser,
    logout, adminLoginLoad, loadAdminHome, updateUserLoad, loadCreateUser, listOrders, updateOrderStatus,
    viewCoupons, loadCreateCoupon, createCoupon, viewReturns, viewReturn, rejectReturn, processReturn, getdashboard ,getOrderData, generateSalesReport, deleteCoupon, viewOrder, getSaleReport, generateAndPreviewSalesReport} = require("../controller/adminController")
const { isAdmin } = require("../middleware/authMiddleware")
const { route } = require("./productRoute")
const router = express.Router()

router.get("/get-orders", listOrders)
router.get('/view-order/:orderId',viewOrder);
router.post("/order-status-update/:id", updateOrderStatus)
router.get("/get-returns", viewReturns)
router.get("/view-return/:returnId", viewReturn)
router.post("/returnReject/:returnId", rejectReturn)
router.post("/acceptReturn/:returnId", processReturn)
router.get("/logout", isAdmin, logout)

router.get("/login", adminLoginLoad)
router.post("/login", loginAdminCtrl)

router.get("/adminHome", isAdmin, loadAdminHome)
router.get("/all-users", isAdmin, getallUser,)
//router.get("/refresh", handleRefreshToken)

router.get("/dashboard", getdashboard)
router.get("/dashboard-data", getOrderData)
router.get("/report-download",getSaleReport)
router.get('/generate-sales-report',generateSalesReport)
router.get("/preview-salesreport",generateAndPreviewSalesReport)


router.get("/create-user", isAdmin, loadCreateUser)
router.post("/create-user", isAdmin, createUser)

router.get("/delete-user/:id", isAdmin, deleteaUser,);

router.get("/edit-user/:id", isAdmin, updateUserLoad,)
router.post("/edit-user/:id", isAdmin, updatedUser,)

router.get("/block-user/:id", isAdmin, blockUser,)
router.get("/unblock-user/:id", isAdmin, unblockUser,)

router.get('/coupons', viewCoupons);
router.get('/coupons/create', loadCreateCoupon)
router.post('/coupons/create', createCoupon)
router.post('/delete-coupon/:id',deleteCoupon)



module.exports = router