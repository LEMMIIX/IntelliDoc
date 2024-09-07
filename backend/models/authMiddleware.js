// backend/models/authMiddleware.js

const authenticateMiddleware = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized: Please log in' });
    }
};

module.exports = authenticateMiddleware;
