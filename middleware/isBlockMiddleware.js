const User = require("../models/userModel")
const checkBlockedStatus = async (req, res, next) => {
  const userId = req.body._id;
  
    try {
      const user = await User.findById(userId);
      
      if (!user) {
     return res.redirect('/api/user/login')
      }
  
      if (user.isBlocked) {
       
        return res.redirect('/api/user/login')
      }
  
      
      next();
    } catch (error) {
        console.error("error");
        return res.redirect('/api/user/login')
      
     
    }
  };
  
  module.exports = { checkBlockedStatus };
  