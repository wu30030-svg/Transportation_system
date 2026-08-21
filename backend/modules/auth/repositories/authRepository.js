const pool = require("../../../config/db");

async function findUserByUsername(username) {
    const query = `
        SELECT
            id,
            username,
            password_hash,
            name,
            role_id,
            is_active
        FROM users
        WHERE username = $1
        LIMIT 1;
    `;

    const result = await pool.query(query, [username]);

    return result.rows[0] || null;
}

module.exports = {
    findUserByUsername
};
