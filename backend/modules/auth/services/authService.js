const bcrypt = require("bcrypt");
const authRepository = require("../repositories/authRepository");

async function login(username, password) {
    // 1. 基本輸入檢查
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

    // 2. 找使用者
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

    // 5. 回傳登入所需的安全資料
    return {
        id: user.id,
        username: user.username,
        name: user.name,
        role_id: user.role_id
    };
}

module.exports = {
    login
};