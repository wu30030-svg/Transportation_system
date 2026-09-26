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
            String(activeSession.user_id) !==
            String(decoded.user_id)
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
     * JWT 的 decoded.user_id
     * 必須對應 users.id。
     *
     * WebSocket 驗證流程：
     *
     * decoded.user_id
     *        ↓
     * users.id
     *
     * activeSession.user_id
     *        ↓
     * users.id
     *
     * 兩者應該相同。
     */
    const user =
        await authRepository.findUserById(
            decoded.user_id
        );

    if (!user) {
        throw new Error("User not found");
    }

    /*
     * user_sessions.user_id 對應 users.id。
     *
     * 注意：
     * users.id 的實際型別依目前資料庫 Schema 為準，
     * 不在 Middleware 內假設一定是 integer。
     */
    const activeSession =
        await authRepository
            .findActiveSessionBySessionId(
                decoded.session_id
            );
    console.log(
        "[WebSocket Auth] decoded:",
        {
            user_id: decoded.user_id,
            session_id: decoded.session_id
        }
    );

    console.log(
        "[WebSocket Auth] activeSession:",
        {
            user_id: activeSession?.user_id,
            session_id: activeSession?.session_id
        }
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
        String(activeSession.user_id) !==
        String(user.id)
    ) {

        console.error(
            "[WebSocket Auth] User ID mismatch:",
            {
                sessionUserId: activeSession.user_id,
                userId: user.id,
                decodedUserId: decoded.user_id
            }
        );

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