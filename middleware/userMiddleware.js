
const userMiddleware = (req, res, next) => {
    if (req.session && req.session.user) {
        
        const currentTime = Date.now();
        const lastAccessTime = req.session.lastAccessTime || currentTime;

        if (currentTime - lastAccessTime > req.session.cookie.maxAge) {
          
            delete req.session.user;
            req.user = undefined;
        } else {
            req.user = req.session.user;
            req.session.lastAccessTime = currentTime;
        }
    }
    next();
};

module.exports = userMiddleware;
