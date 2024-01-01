const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');





/*const changePassword = asyncHandler(async (req, res) => {
    const userId = req.session.user.userId;
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.render("resetPassword", { message: "Password and confirm password should be the same" });
    }

    const user = await User.findOneAndUpdate({ _id: userId },{ $set: { password: newPassword } } );

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.redirect("/api/user/profile");
});*/

module.exports ={
    changePasswordPage,
    changePassword
}