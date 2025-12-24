const jwt = require('jsonwebtoken');

const authDeviceMiddleware = (req, res, next) => {
    try {
        // Get token from request headers
        const token = req.headers.authorization?.split(' ')[1] || req.headers['x-device-token'];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Authorization required.',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token',
            error: error.message,
        });
    }
};

module.exports = authDeviceMiddleware;
