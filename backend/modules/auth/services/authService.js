const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const authRepository =
    require("../repositories/authRepository");

async function login(username, password) {

    // ========================================
    // 1. 驗證登入帳號
    // ========================================

    if (!username || username.trim() === "") {

        const error =
            new Error("Username is required");

        error.statusCode = 400;

        throw error;
    }

    if (!password || password === "") {

        const error =
            new Error("Password is required");

        error.statusCode = 400;

        throw error;
    }


    // ========================================
    // 2. 查詢使用者
    // ========================================

    const user =
        await authRepository.findUserByUsername(
            username.trim()
        );

    if (!user) {

        const error =
            new Error(
                "Invalid username or password"
            );

        error.statusCode = 401;

        throw error;
    }


    // ========================================
    // 3. 檢查帳號是否啟用
    // ========================================

    if (!user.is_active) {

        const error =
            new Error(
                "User account is inactive"
            );

        error.statusCode = 403;

        throw error;
    }


    // ========================================
    // 4. 驗證密碼
    // ========================================

    const passwordMatch =
        await bcrypt.compare(
            password,
            user.password_hash
        );

    if (!passwordMatch) {

        const error =
            new Error(
                "Invalid username or password"
            );

        error.statusCode = 401;

        throw error;
    }


    // ========================================
    // 5. 檢查目前是否已有登入 Session
    // ========================================

    const activeSession =
        await authRepository.findActiveSessionByUserId(
            user.id
        );

    if (activeSession) {

        const error =
            new Error(
                "此帳號目前已在其他裝置登入"
            );

        error.statusCode = 409;

        throw error;
    }


    // ========================================
    // 6. 建立新的 Session ID
    // ========================================

    const sessionId =
        crypto.randomUUID();


    // ========================================
    // 7. 計算 Session 到期時間
    // ========================================

    const expiresAt =
        new Date(
            Date.now() +
            8 * 60 * 60 * 1000
        );


    // ========================================
    // 8. 建立 User Session
    // ========================================

    await authRepository.createSession(
        user.id,
        sessionId,
        expiresAt
    );


    // ========================================
    // 9. 建立登入身份
    // ========================================

    const identity = {

        user_id: user.user_id,

        username: user.username,

        role_id: user.role_id,

        access_context:
            user.access_context || null,

        personnel_id:
            user.personnel_id || null,

        session_id: sessionId

    };


    // ========================================
    // 10. 簽發 JWT
    // ========================================

    const token =
        jwt.sign(
            identity,
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );


    // ========================================
    // 11. 回傳登入結果
    // ========================================

    return {

        user: {

            id: user.id,

            username: user.username,

            name: user.name,

            role_id: user.role_id,

            access_context:
                user.access_context || null,

            personnel_id:
                user.personnel_id || null,

            personnel_number:
                user.personnel_number || null,

            personnel_name:
                user.personnel_name || null

        },

        token

    };
}

// ========================================
// Logout
// ========================================

async function logout(sessionId) {

    if (!sessionId) {

        const error =
            new Error("Invalid session");

        error.statusCode = 401;

        throw error;
    }

    await authRepository.deleteSession(
        sessionId
    );
}

// ========================================
// Force Logout By Username
// ========================================

async function forceLogout(username) {

    if (!username || username.trim() === "") {

        const error =
            new Error("Username is required");

        error.statusCode = 400;

        throw error;
    }

    const user =
        await authRepository.findUserByUsername(
            username.trim()
        );

    if (!user) {

        const error =
            new Error("User not found");

        error.statusCode = 404;

        throw error;
    }

    const activeSession =
        await authRepository.findActiveSessionByUserId(
            user.id
        );

    if (!activeSession) {

        return {
            username: user.username,
            user_id: user.user_id,
            session_id: null,
            had_session: false
        };
    }

    await authRepository.deleteSession(
        activeSession.session_id
    );

    return {
        username: user.username,
        user_id: user.user_id,
        session_id: activeSession.session_id,
        had_session: true
    };
}

module.exports = {
    login,
    logout,
    forceLogout
};