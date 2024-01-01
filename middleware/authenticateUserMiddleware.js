const User = require('../models/userModel');

const authenticateUser = async (req, res, next) => {
    if (req.session && req.session.user) {
        try {
            const user = await User.findById(req.session.user.userId);

            if (user) {
                req.user = user;
            } else {
                console.error('User not found in database');
                delete req.session.user;
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            delete req.session.user;
        }
    }

    next();
};

module.exports = authenticateUser;
