const CategoryOffer = require("../models/categoryOfferModel")
const Product = require("../models/productModel")
const Category = require("../models/categoryModel")
const asyncHandler = require("express-async-handler")
const slugify = require("slugify")
const User = require("../models/userModel")



const loadCreateProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("adminCreateProduct", { categories });
  } catch (error) {
    console.log(error.message);
  }
}

const createProduct = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  try {

    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const images = req.files.map((file) => file.filename);
    console.log('New Product Images:', images);
    const newProduct = await Product.create({
      ...req.body,
      //category: req.body.category,
      images: images,
    });

    res.redirect('/product/getallproducts');
  } catch (error) {
    //console.error(error);
    res.render("adminCreateProduct", { categories, message: "Invalid entries, please check the format" });

  }
});





const loadCreateCategory = asyncHandler(async (req, res) => {
  try {
    res.render("adminCreateCategory")
  } catch (error) {
    console.log(error.message)
  }
})

const renderCreateOfferPage = asyncHandler(async (req, res) => {
  const CategoryId = req.params.categoryId
  console.log("category id:", CategoryId);
  try {
    res.render('adminCreateCategoryOffer', { CategoryId });

  } catch (error) {
    res.render('somethingWentwrong');

  }
});

const createCategoryOffer = asyncHandler(async (req, res) => {
  try {
    const { CategoryId, offerPercentage, expiryDate } = req.body;
    console.log("category id is:", CategoryId);
    console.log("offer % is:", offerPercentage);
    console.log("expiryDate is:", expiryDate);

    if (!CategoryId || !offerPercentage || !expiryDate) {
      return res.render('adminCreateCategoryOffer', { message: 'Invalid entries' });
    }

    // Use the correct variable name CategoryId when creating CategoryOffer
    const categoryOffer = await CategoryOffer.create({
      category: CategoryId,
      offerPercentage,
      expiryDate,
    });

    res.redirect(`/product/getallcategory`);
  } catch (error) {
    res.render("SomethingWentwrong");
  }
});



const createCategory = asyncHandler(async (req, res) => {
  try {
    const { name, percentageDiscount } = req.body;
    const newCategory = await Category.create({ name });

   // await createCategoryOffer(newCategory._id, percentageDiscount);

    res.redirect("/product/getallcategory");
  } catch (error) {
    console.error('Error creating category:', error);
    res.render("SomethingWentwrong");
  }
});


const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();

    res.render('adminViewCategory', { categories });
  } catch (error) {
    console.error(error);
    res.render("SomethingWentwrong");
  }
};

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const categories = await Category.find();
  try {
    const productsInCategory = await Product.find({ category: id });

    if (productsInCategory.length > 0) {//check product are available or not

      const message = 'Cannot delete category. Delete assosciated products first';
      res.render('adminViewCategory', { categories, message });
    } else {
      await Category.findByIdAndDelete(id);
      res.redirect('/product/getallcategory');
    }
  } catch (error) {
    res.render('adminViewCategory', { categories, message });
  }
});

const updateProductLoad = async (req, res) => {
  const { id } = req.params;
  const categories = await Category.find();
  try {
    const product = await Product.findById(id);
    res.render('adminUpdateProduct', { product: product, categories });

  } catch (error) {
    console.log(error.message)
  }
}
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const categories = await Category.find();

  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }

    let updatedProduct;

    if (req.files && req.files.length > 0) {
      const existingProduct = await Product.findById(id);
      const existingImages = existingProduct.images || [];

      const images = [...existingImages, ...req.files.map((file) => file.filename)];

      updatedProduct = await Product.findByIdAndUpdate(
        id,
        { ...req.body, images: images },
        { new: true }
      );
    } else {
      updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
        new: true,
      });
    }

    res.redirect('/product/getallproducts');
  } catch (error) {
    res.render("adminUpdateProduct", { categories, message: "Invalid entries, please check the format" });
  }
});


const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: { softDelete: true } },
      { new: true } // Return the updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.redirect("/product/getallproducts");
  } catch (error) {
    throw new Error(error);
  }
});

const restoreProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: { softDelete: false } },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.redirect("/product/getallproducts");
  } catch (error) {
    throw new Error(error);
  }
});


const getAllProduct = asyncHandler(async (req, res) => {
  try {
    //Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.category) {
      query.category = req.query.category;
    }

    //Search 
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { 'category.name': { $regex: req.query.search, $options: 'i' } },
        { brand: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    const category = await Category.find();
    const products = await Product.find(query)
      .populate("category", "name")
      .skip(skip)
      .limit(limit);

    res.render("adminProductView", {
      products: products,
      category: category,
      currentPage: page,
      totalPages: Math.ceil(products.length / limit),
      totalItems: products.length,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const deleteImage = async (req, res) => {

  const { id, imageName } = req.params;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const imageIndex = product.images.indexOf(imageName);

    if (imageIndex !== -1) {
      product.images.splice(imageIndex, 1);
      await product.save();
      res.redirect("/product/update-product/" + id)
    } else {
      return res.status(404).json({ message: 'Image not found ' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

//////////////user side/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const calculateDiscountedPrice = (originalPrice, offerPercentage) => {
  if (offerPercentage && offerPercentage > 0 && offerPercentage <= 100) {
    const discountAmount = (originalPrice * offerPercentage) / 100;
    const discountedPrice = originalPrice - discountAmount;

    return Math.round(discountedPrice * 100) / 100;
  } else {
    return originalPrice;
  }
};

const userAllProduct = asyncHandler(async (req, res) => {
  try {
    const user = req.session.user;
    //console.log('User data in products:', req.session.user);

    const searchQuery = req.query.search || "";
    const categoryFilter = req.query.category || "";
    const sortOption = req.query.sort || "";
    console.log("search", searchQuery);
    console.log("category", categoryFilter);
    console.log("sort", sortOption);
    const query = {};

    if (searchQuery || categoryFilter) {
      query.$and = [];

      if (searchQuery) {
        query.$and.push({
          $or: [
            { brand: { $regex: searchQuery, $options: "i" } },
            { title: { $regex: searchQuery, $options: "i" } },
          ],
        });
      }

      if (categoryFilter) {
        query.$and.push({ category: categoryFilter });
      }
    }

    const productsQuery = {
      $and: [
        query.$and && query.$and.length > 0 ? { $and: query.$and } : {},
        { softDelete: { $ne: true } },
      ],
    };

    let sortCriteria = {};

    if (sortOption === "desc") {
      sortCriteria = { price: -1 };
    } else if (sortOption === "asc") {
      sortCriteria = { price: 1 };
    }

    const products = await Product.find(productsQuery)
      .sort(sortCriteria)
      .populate("category", "title");

      console.log("result:",products);
      console.log("search query:",searchQuery);

    const category = await Category.find();

    res.render("allproducts", { products, searchQuery, category, user });
  } catch (error) {
    res.render("SomethingWentwrong");
  }
});

const getCartCount = asyncHandler(async (req, res) => {
  try {
    const userId = req.session.user.userId;
    const user = await User.findById(userId); console.log("cartcount user:", user);
    if (!user || !user.cart) {
      console.log("User or user.cart is undefined");
      res.json({ cartCount: 0 });
      return;
    }

    const cartCount = user.cart.length;
    console.log("cart count:", cartCount);
    res.json({ cartCount });
  } catch (error) {
    console.log('Error fetching cart count:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



const getaProduct = asyncHandler(async (req, res) => {//view a product
  const user = req.session.user;
  console.log('User data in singleproduct:', req.session.user);
  const { id } = req.params
  try {
    const product = await Product.findById(id).populate('category');
    const categoryOffer = await CategoryOffer.findOne({ category: product.category });
    console.log(product);

    let offerPrice = null; // Initialize offerPrice variable

    if (categoryOffer) {
      offerPrice = calculateDiscountedPrice(product.price, categoryOffer.offerPercentage);
    }

    res.render("userviewSingleProduct", { product, user, offerPrice });
  } catch (error) {
    res.render("SomethingWentwrong");
  }
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    const categoryOffer = await CategoryOffer.findOne({ category: product.category });
    let offerPrice = null;

    if (categoryOffer) {
      offerPrice = calculateDiscountedPrice(product.price, categoryOffer.offerPercentage);
    }
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const wishlistItem = {
      product: id,
      price: product.price,
      images: product.images,
      brand: product.brand
    };


    user.wishlist.push(wishlistItem);

    await user.save({ validateBeforeSave: false });
    res.redirect("/product/getproduct/" + id)
    //res.redirect("/api/product/get-wishlist")
    //res.render("userviewSingleProduct", { product, user, offerPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

const getWishlistItems = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).populate({
    path: 'wishlist.product',
    select: 'title images price',
  });

  res.render('userViewWishlist', { wishlist: user.wishlist, user: user });
});

const removeFromWishlistt = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user.userId);
  user.wishlist = user.wishlist.filter((item) => !item.product.equals(productId));

  await user.save({ validateBeforeSave: false });

  res.redirect("/product/get-wishlist");
});



module.exports = {
  loadCreateProduct,
  deleteImage,
  createProduct,
  loadCreateCategory,
  createCategory,
  getAllCategories,
  deleteCategory,
  getaProduct,
  getAllProduct,
  updateProductLoad,
  updateProduct, addToWishlist, getWishlistItems, removeFromWishlistt,
  deleteProduct, restoreProduct, userAllProduct, getCartCount, renderCreateOfferPage, createCategoryOffer
}