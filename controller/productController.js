const Product = require("../models/productModel")
const Category = require("../models/categoryModel")
const asyncHandler = require("express-async-handler")
const slugify = require("slugify")



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
    const newProduct = await Product.create({
      ...req.body,
      //category: req.body.category,
      images: images,
    });

    res.redirect('/api/product/getallproducts');
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

const createCategory = asyncHandler(async (req, res) => {
  try {
    const { name } = req.body
    const newCategory = await Category.create({ name })
    res.redirect("/api/product/getallcategory")
  } catch (error) {
    res.render("adminCreateCategory", { message: "Invalid entries" })

  }
})

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();

    res.render('adminViewCategory', { categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
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
      res.redirect('/api/product/getallcategory');
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
  const categories = await Category.find()

  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }

    let updatedProduct;

    if (req.files && req.files.length > 0) {

      const images = req.files.map((file) => file.filename);

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

    res.redirect('/api/product/getallproducts');
  } catch (error) {
    res.render("adminUpdateProduct", { categories, message: "Invalid entries, please check the format" });
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    await Product.findByIdAndDelete(id);
    res.redirect("/api/product/getallproducts");
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
      res.redirect("/api/product/getallproducts")
    } else {
      return res.status(404).json({ message: 'Image not found ' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

//////////////user side/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const userAllProduct = asyncHandler(async (req, res) => {
  try {
    const user = req.session.user;
    console.log('User data in products:', req.session.user);
    const searchQuery = req.query.search || "";
    const categoryFilter = req.query.category || "";
    console.log("Search Query:", searchQuery);
    console.log("Category Filter:", categoryFilter);
    const query = {};

    if (searchQuery) {
      query.$or = [
        { brand: { $regex: searchQuery, $options: "i" } },
        { title: { $regex: searchQuery, $options: "i" } },
      ];
    }

    if (categoryFilter) {
      query.category = categoryFilter;
    }

    const products = await Product.find(query).populate("category", "name");
    const category = await Category.find();

    res.render("allproducts", { products, searchQuery, category,user });
  } catch (error) {
    throw new Error(error);
  }
});

const getaProduct = asyncHandler(async (req, res) => {//view a product
  const user = req.session.user;
  console.log('User data in singleproduct:', req.session.user);
  const { id } = req.params
  try {
    const findProduct = await Product.findById(id).populate('category');
    console.log(findProduct);
    res.render("userviewSingleProduct", { product: findProduct, user })
  } catch (error) {
    throw new Error(error)
  }
})






module.exports = { loadCreateProduct, deleteImage, createProduct, loadCreateCategory, createCategory, getAllCategories, deleteCategory, getaProduct, getAllProduct, updateProductLoad, updateProduct, deleteProduct, userAllProduct }