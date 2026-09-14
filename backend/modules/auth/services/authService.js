const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authRepository = require("../repositories/authRepository");

async function login(username, password) {
    // 1. 驗證登入帳號
    if (!username || username.trim() === "") {
        const error = new Error("Username is required");
        error.statusCode = 400;
        throw error;
    }

    if (!password || password === "") {
        const error = new Error("Password is required");
        error.statusCode = 400;
        throw error;
    }

    // 2. 查詢使用者
    const user = await authRepository.findUserByUsername(
        username.trim()
    );

    if (!user) {
        const error = new Error("Invalid username or password");
        error.statusCode = 401;
        throw error;
    }

    // 3. 檢查帳號是否啟用
    if (!user.is_active) {
        const error = new Error("User account is inactive");
        error.statusCode = 403;
        throw error;
    }

    // 4. 驗證密碼
    const passwordMatch = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordMatch) {
        const error = new Error("Invalid username or password");
        error.statusCode = 401;
        throw error;
    }

    // 5. 建立登入身份
    const identity = {
        user_id: user.id,
        username: user.username,
        role_id: user.role_id,
        access_context: user.access_context || null,
        personnel_id: user.personnel_id || null
    };

    // 6. 簽發 JWT
    const token = jwt.sign(
        identity,
        process.env.JWT_SECRET,
        {
            expiresIn: "8h"
        }
    );

    // 7. 回傳登入結果
    return {
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role_id: user.role_id,
            access_context: user.access_context || null,

            personnel_id: user.personnel_id || null,
            personnel_number: user.personnel_number || null,
            personnel_name: user.personnel_name || null
        },
        token
    };
}

module.exports = {
    login
};
