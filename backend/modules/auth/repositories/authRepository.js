const pool = require("../../../config/db");


// ========================================
// Find User By Username
// ========================================

async function findUserByUsername(username) {
    const query = `
        SELECT
            u.id,
            u.user_id,
            u.username,
            u.password_hash,
            u.name,
            u.role_id,
            u.is_active,

            p.id AS personnel_id,
            p.personnel_number,
            p.name AS personnel_name,
            p.status AS personnel_status

        FROM users u

        LEFT JOIN personnel p
            ON p.user_id = u.id

        WHERE u.username = $1
        LIMIT 1;
    `;

    const result = await pool.query(query, [username]);

    return result.rows[0] || null;
}


// ========================================
// Find User By ID
// ========================================

async function findUserById(userId) {
    const query = `
        SELECT
            u.id,
            u.user_id,
            u.username,
            u.name,
            u.role_id,
            u.is_active,

            p.id AS personnel_id,
            p.personnel_number,
            p.name AS personnel_name,
            p.status AS personnel_status

        FROM users u

        LEFT JOIN personnel p
            ON p.user_id = u.id

        WHERE u.id = $1
        LIMIT 1;
    `;

    const result = await pool.query(query, [userId]);

    return result.rows[0] || null;
}


module.exports = {
    findUserByUsername,
    findUserById
};
