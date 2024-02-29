const express = require("express")
const { isAdmin } = require("../middleware/authMiddleware")
const { loadCreateProduct, createProduct, loadCreateCategory, createCategory, getAllCategories, getaProduct, getAllProduct, updateProductLoad, updateProduct, deleteProduct, userAllProduct, deleteCategory, deleteImage, renderCreateOfferPage, createCategoryOffer, addToWishlist, getWishlistItems, restoreProduct, removeFromWishlistt, getCartCount } = require("../controller/productController")
const { addToCart, removeFromCart, updateCartItem, getCartItems } = require("../controller/cartController")
//const authenticateUser = require("../middleware/authenticateUserMiddleware")
const router = express.Router()
const upload = require('../config/multerConfig');
const { getAllCategoryOffers, deleteCategoryOffer } = require("../controller/adminController")



router.get("/create-product",isAdmin, loadCreateProduct);
//router.post("/create-product", createProduct);
router.route('/create-product').post(upload.array('images', 4),isAdmin, createProduct);

router.get("/create-category",isAdmin, loadCreateCategory)
router.post("/create-category",isAdmin, createCategory)
router.get("/deletecategory/:id",isAdmin, deleteCategory)

router.get("/getallcategory",isAdmin, getAllCategories)

router.post("/delete-product/:id",isAdmin, deleteProduct);
router.get("/restore-product/:id",restoreProduct)


router.get("/getallproducts",isAdmin, getAllProduct);
router.get("/delete-image/:id/:imageName",isAdmin, deleteImage)
router.get("/allproducts", userAllProduct);
// In your routes or controller
router.get('/get-cart-count',getCartCount);

router.get("/getproduct/:id", getaProduct);

router.get("/update-product/:id", updateProductLoad);
router.route('/update-product/:id').post(upload.array('images', 4),isAdmin, updateProduct);
//router.post("/update-product/:id", upload.array('images', 4), updateProduct)
//router.post("/update-product/:id", updateProduct);

router.post('/add-to-cart/:id', addToCart);
router.post("/add-to-wishlist/:id",addToWishlist)
router.get('/get-cart-items', getCartItems);
router.get("/get-wishlist",getWishlistItems)
router.post('/remove-from-cart/:productId', removeFromCart);
router.post('/remove-from-wishlist/:productId', removeFromWishlistt);
router.post('/update-cart-item/:cartItemId', updateCartItem);

router.get("/create-offer/:categoryId",renderCreateOfferPage)
router.post("/create-offer/:categoryId",createCategoryOffer)
router.get("/getoffers",getAllCategoryOffers)
router.post("/deleteoffer",deleteCategoryOffer)
module.exports = router