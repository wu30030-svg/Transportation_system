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
            u.access_context,
            u.remark,
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
            u.access_context,
            u.remark,
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

// ========================================
// Find User By Public User ID
// ========================================

async function findUserByPublicUserId(userId) {

    const query = `
        SELECT
            u.id,
            u.user_id,
            u.username,
            u.name,
            u.role_id,
            u.access_context,
            u.remark,
            u.is_active,

            p.id AS personnel_id,
            p.personnel_number,
            p.name AS personnel_name,
            p.status AS personnel_status

        FROM users u

        LEFT JOIN personnel p
            ON p.user_id = u.id

        WHERE u.user_id = $1
        LIMIT 1;
    `;

    const result =
        await pool.query(
            query,
            [userId]
        );

    return result.rows[0] || null;
}

// ========================================
// Find Active Session By User ID
// ========================================

async function findActiveSessionByUserId(userId) {

    const query = `
        SELECT
            id,
            user_id,
            session_id,
            created_at,
            expires_at
        FROM user_sessions
        WHERE user_id = $1
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1;
    `;

    const result =
        await pool.query(
            query,
            [userId]
        );

    return result.rows[0] || null;
}


// ========================================
// Create User Session
// ========================================

async function createSession(
    userId,
    sessionId,
    expiresAt
) {

    const query = `
        INSERT INTO user_sessions (
            user_id,
            session_id,
            expires_at
        )
        VALUES ($1, $2, $3)
        RETURNING
            id,
            user_id,
            session_id,
            created_at,
            expires_at;
    `;

    const result =
        await pool.query(
            query,
            [
                userId,
                sessionId,
                expiresAt
            ]
        );

    return result.rows[0];
}

// ========================================
// Delete User Session
// ========================================

async function deleteSession(sessionId) {

    const query = `
        DELETE FROM user_sessions
        WHERE session_id = $1;
    `;

    await pool.query(
        query,
        [sessionId]
    );
}

async function findActiveSessionBySessionId(sessionId) {
    const query = `
        SELECT
            id,
            user_id,
            session_id,
            created_at,
            expires_at
        FROM user_sessions
        WHERE session_id = $1
          AND expires_at > NOW()
        LIMIT 1;
    `;

    const result = await pool.query(query, [sessionId]);

    return result.rows[0] || null;
}

module.exports = {
    findUserByUsername,
    findUserById,
    findUserByPublicUserId,
    findActiveSessionByUserId,
    createSession,
    deleteSession,
    findActiveSessionBySessionId
};
