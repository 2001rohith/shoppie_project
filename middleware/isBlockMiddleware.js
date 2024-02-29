const User = require("../models/userModel")
const checkBlockedStatus = async (req, res, next) => {
  console.log("user in middleware:",req.session.user);
  const userId = req.session.user.userId;
  
    try {
      const user = await User.findById(userId);
      //console.log("user in block check middleware:",user);
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
  