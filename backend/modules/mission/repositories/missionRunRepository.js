const pool = require("../../../config/db");


// ========================================
// Create Mission Run
// ========================================

async function createMissionRun(
    {
        missionId
    },
    db = pool
) {

    const query = `
        INSERT INTO mission_runs (
            mission_id
        )
        VALUES ($1)
        RETURNING *;
    `;

    const result = await db.query(query, [
        missionId
    ]);

    return result.rows[0];
}


// ========================================
// Find Mission Run By ID
// ========================================

async function findMissionRunById(
    id,
    db = pool
) {

    const query = `
        SELECT *
        FROM mission_runs
        WHERE id = $1;
    `;

    const result = await db.query(query, [
        id
    ]);

    return result.rows[0] || null;
}


// ========================================
// Find Mission Runs By Mission
// ========================================

async function findMissionRunsByMissionId(
    missionId,
    db = pool
) {

    const query = `
        SELECT *
        FROM mission_runs
        WHERE mission_id = $1
        ORDER BY started_at DESC;
    `;

    const result = await db.query(query, [
        missionId
    ]);

    return result.rows;
}


// ========================================
// Update Mission Run Status
// ========================================

async function updateMissionRunStatus(
    id,
    status,
    db = pool
) {

    const query = `
        UPDATE mission_runs
        SET
            status = $1::varchar,

            completed_at = CASE
                WHEN $1::varchar IN (
                    'COMPLETED',
                    'ABORTED'
                )
                    THEN NOW()
                ELSE completed_at
            END,

            updated_at = NOW()

        WHERE id = $2

        RETURNING *;
    `;

    const result = await db.query(query, [
        status,
        id
    ]);

    return result.rows[0] || null;
}


module.exports = {
    createMissionRun,
    findMissionRunById,
    findMissionRunsByMissionId,
    updateMissionRunStatus
};
