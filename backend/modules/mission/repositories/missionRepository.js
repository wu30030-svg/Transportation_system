const pool = require("../../../config/db");

// 建立 Mission
async function createMission({
    missionName,
    description,
    purpose,
    startTime,
    createdBy
}) {
    const query = `
        INSERT INTO missions (
            mission_name,
            description,
            purpose,
            start_time,
            created_by
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;

    const values = [
        missionName,
        description || null,
        purpose || null,
        startTime || null,
        createdBy || null
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
}


// 取得單一 Mission
async function findMissionById(id) {
    const query = `
        SELECT *
        FROM missions
        WHERE id = $1;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
}

// 取得 Mission 列表
async function findAllMissions() {
    const query = `
        SELECT *
        FROM missions
        ORDER BY created_at DESC;
    `;

    const result = await pool.query(query);

    return result.rows;
}

// 更新 Mission
async function updateMission(
    id,
    {
        missionName,
        description,
        purpose,
        startTime
    }
) {
    const query = `
        UPDATE missions
        SET
            mission_name = $1,
            description = $2,
            purpose = $3,
            start_time = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING *;
    `;

    const values = [
        missionName,
        description || null,
        purpose || null,
        startTime || null,
        id
    ];

    const result = await pool.query(query, values);

    return result.rows[0] || null;
}

// 更新 Mission Status
async function updateMissionStatus(id, status) {
    const query = `
        UPDATE missions
        SET
            status = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *;
    `;

    const result = await pool.query(query, [
        status,
        id
    ]);

    return result.rows[0] || null;
}

module.exports = {
    createMission,
    findMissionById,
    findAllMissions,
    updateMission,
    updateMissionStatus
};