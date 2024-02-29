const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require("../models/userModel");

const isAdmin = asyncHandler(async (req, res, next) => {
  try {
    console.log("isAdmin middleware executed");
    const refreshToken = req.cookies.refreshToken;
    console.log("Refresh Token:", refreshToken);

    if (!refreshToken) {
      console.log("No refresh token, redirecting to login");
      return res.redirect('/admin/login');
    }

    const decodedToken = jwt.verify(refreshToken, process.env.JWT_SECRET);
    console.log("Decoded Token:", decodedToken);

    const userId = decodedToken.id;
    const findUser = await User.findById(userId);
    console.log("Found User:", findUser);

    if (!findUser) {
      console.log("User not found, redirecting to login");
      return res.redirect('/admin/login');
    }

    const userRole = findUser.role;

    if (userRole === 'admin') {
      console.log("User is an admin, allowing access");
      return next();
    } else {
      console.log("User is not an admin, redirecting to login");
      return res.redirect('/admin/login');
    }
  } catch (error) {
    console.error("Error in isAdmin middleware:", error);
    res.redirect('/admin/login');
  }
});

module.exports = { isAdmin };

