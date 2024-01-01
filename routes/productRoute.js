const express = require("express")
const { isAdmin } = require("../middleware/authMiddleware")
const { loadCreateProduct, createProduct, loadCreateCategory, createCategory, getAllCategories, getaProduct, getAllProduct, updateProductLoad, updateProduct, deleteProduct, userAllProduct, deleteCategory, deleteImage } = require("../controller/productController")
const { addToCart, removeFromCart, updateCartItem, getCartItems } = require("../controller/cartController")
//const authenticateUser = require("../middleware/authenticateUserMiddleware")
const router = express.Router()
const upload = require('../config/multerConfig');



router.get("/create-product",isAdmin, loadCreateProduct);
//router.post("/create-product", createProduct);
router.route('/create-product').post(upload.array('images', 4),isAdmin, createProduct);

router.get("/create-category",isAdmin, loadCreateCategory)
router.post("/create-category",isAdmin, createCategory)
router.get("/deletecategory/:id",isAdmin, deleteCategory)

router.get("/getallcategory",isAdmin, getAllCategories)

router.get("/delete-product/:id",isAdmin, deleteProduct);


router.get("/getallproducts",isAdmin, getAllProduct);
router.get("/delete-image/:id/:imageName",isAdmin, deleteImage)
router.get("/allproducts", userAllProduct);
router.get("/getproduct/:id", getaProduct);

router.get("/update-product/:id", updateProductLoad);
router.route('/update-product/:id').post(upload.array('images', 4),isAdmin, updateProduct);
//router.post("/update-product/:id", upload.array('images', 4), updateProduct)
//router.post("/update-product/:id", updateProduct);

router.post('/add-to-cart/:id', addToCart);
router.get('/get-cart-items', getCartItems);
router.post('/remove-from-cart/:productId', removeFromCart);
router.post('/update-cart-item/:cartItemId', updateCartItem);



module.exports = router