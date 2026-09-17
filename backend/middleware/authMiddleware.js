const jwt = require("jsonwebtoken");

const authRepository =
    require("../modules/auth/repositories/authRepository");

async function authenticateToken(req, res, next) {

    try {

        // ========================================
        // 1. 取得 Authorization Header
        // ========================================

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }


        // ========================================
        // 2. 解析 Bearer Token
        // ========================================

        const [scheme, token] =
            authHeader.split(" ");

        if (
            scheme !== "Bearer" ||
            !token
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid authorization format"
            });
        }


        // ========================================
        // 3. 驗證 JWT
        // ========================================

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // ========================================
        // 4. 確認 JWT 有 Session ID
        // ========================================

        if (!decoded.session_id) {

            return res.status(401).json({
                success: false,
                message: "Invalid session"
            });
        }


        // ========================================
        // 5. 確認 Session 仍存在且未過期
        // ========================================

        const activeSession =
            await authRepository
                .findActiveSessionBySessionId(
                    decoded.session_id
                );

        if (!activeSession) {

            return res.status(401).json({
                success: false,
                message:
                    "Session expired or logged out"
            });
        }


        // ========================================
        // 6. 驗證 Session 所屬使用者
        // ========================================

        if (
            activeSession.user_id !==
            decoded.user_id
        ) {

            return res.status(401).json({
                success: false,
                message: "Invalid session"
            });
        }


        // ========================================
        // 7. 驗證完成
        // ========================================

        req.user = decoded;

        next();

    } catch (error) {

        console.error(
            "JWT Authentication Error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired token"
        });
    }
}

module.exports = {
    authenticateToken
};