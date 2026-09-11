const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const [scheme, token] = authHeader.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch (error) {
        console.error("JWT Authentication Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}

module.exports = {
    authenticateToken
};
