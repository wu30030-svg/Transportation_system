require("dotenv").config();

const bcrypt = require("bcrypt");
const db = require("./config/db");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("請輸入新的 admin 登入密碼：", async (password) => {
    try {
        if (!password || password.length < 8) {
            throw new Error("密碼至少需要 8 個字元。");
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await db.query(`
            UPDATE users
            SET password_hash = $1
            WHERE username = 'admin'
            RETURNING id, username, name, role_id, is_active;
        `, [passwordHash]);

        if (result.rows.length === 0) {
            throw new Error("找不到 admin 帳號。");
        }

        console.log("Admin 密碼已成功更新。");
        console.table(result.rows);
    } catch (error) {
        console.error("密碼更新失敗：");
        console.error(error.message);
    } finally {
        rl.close();
        await db.end();
    }
});
