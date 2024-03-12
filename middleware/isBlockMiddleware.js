const User = require("../models/userModel")
const checkBlockedStatus = async (req, res, next) => {
  console.log("user in middleware:",req.session.user);
  const userId = req.session.user ? req.session.user.userId : null;  
    try {
      if (!userId) {
        return res.redirect('/user/login');
      }
      const user = await User.findById(userId);
      if (!user) {
     return res.redirect('/user/login')
      }
  
      if (user.isBlocked==true) {
       
        return res.redirect('/user/login')
      }
  
      
      next();
    } catch (error) {
        console.error("error");
        return res.redirect('/user/login')
      
     
    }
  };
  
  module.exports = { checkBlockedStatus };
  