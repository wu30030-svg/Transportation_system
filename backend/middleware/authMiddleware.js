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

async function authenticateWebSocketToken(token) {

    if (!token) {
        throw new Error("Authentication required");
    }

    const decoded =
        jwt.verify(
            token,
            process.env.JWT_SECRET
        );

    if (!decoded.session_id) {
        throw new Error("Invalid session");
    }

    /*
     * JWT 的 decoded.user_id 是 public UUID
     *
     * 例如：
     * 1e7dd38a-2545-4b6f-837b-20b6393dfb03
     */
    const user =
        await authRepository.findUserByPublicUserId(
            decoded.user_id
        );

    if (!user) {
        throw new Error("User not found");
    }

    /*
     * user_sessions.user_id 對應的是
     * users.id，也就是 internal integer ID。
     */
    const activeSession =
        await authRepository
            .findActiveSessionBySessionId(
                decoded.session_id
            );

    if (!activeSession) {
        throw new Error(
            "Session expired or logged out"
        );
    }

    /*
     * 比較正確的兩個 ID：
     *
     * activeSession.user_id
     *        ↓
     * users.id
     *
     * user.id
     *        ↓
     * users.id
     */
    if (
        Number(activeSession.user_id) !==
        Number(user.id)
    ) {
        throw new Error("Invalid session");
    }

    /*
     * 回傳 WebSocket 使用者資料。
     *
     * user_id 保持 public UUID，
     * 不要改成 internal integer ID。
     */
    return {
        ...decoded,

        user_id:
            user.user_id,

        username:
            user.username,

        role_id:
            user.role_id,

        access_context:
            user.access_context || null,

        personnel_id:
            user.personnel_id || null,

        personnel_number:
            user.personnel_number || null,

        personnel_name:
            user.personnel_name || null
    };
}

module.exports = {
    authenticateToken,
    authenticateWebSocketToken
};