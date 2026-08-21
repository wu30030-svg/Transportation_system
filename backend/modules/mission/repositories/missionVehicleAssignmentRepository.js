const pool = require("../../../config/db");


// ========================================
// Create Mission Vehicle Assignment
// ========================================

async function createAssignment({
    missionId,
    vehicleId,
    driverId,
    commanderId,
    isMainVehicle = false,
    status = "ASSIGNED"
}) {

    const query = `
        INSERT INTO mission_vehicle_assignments (
            mission_id,
            vehicle_id,
            driver_id,
            commander_id,
            is_main_vehicle,
            status
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
        )
        RETURNING *;
    `;

    const values = [
        missionId,
        vehicleId,
        driverId,
        commanderId || null,
        isMainVehicle,
        status
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
}


// ========================================
// Find Assignment By ID
// ========================================

async function findAssignmentById(id) {

    const query = `
        SELECT *
        FROM mission_vehicle_assignments
        WHERE id = $1;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
}


// ========================================
// Find Assignments By Mission
// ========================================

async function findAssignmentsByMissionId(missionId) {

    const query = `
        SELECT *
        FROM mission_vehicle_assignments
        WHERE mission_id = $1
        ORDER BY is_main_vehicle DESC, created_at ASC;
    `;

    const result = await pool.query(query, [missionId]);

    return result.rows;
}


// ========================================
// Find Main Vehicle Assignment
// ========================================

async function findMainAssignment(missionId) {

    const query = `
        SELECT *
        FROM mission_vehicle_assignments
        WHERE mission_id = $1
          AND is_main_vehicle = true
        LIMIT 1;
    `;

    const result = await pool.query(query, [missionId]);

    return result.rows[0] || null;
}


// ========================================
// Update Assignment
// ========================================

async function updateAssignment(
    id,
    {
        vehicleId,
        driverId,
        commanderId,
        isMainVehicle,
        status
    }
) {

    const query = `
        UPDATE mission_vehicle_assignments
        SET
            vehicle_id = COALESCE($2, vehicle_id),
            driver_id = COALESCE($3, driver_id),
            commander_id = $4,
            is_main_vehicle = COALESCE($5, is_main_vehicle),
            status = COALESCE($6, status),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *;
    `;

    const values = [
        id,
        vehicleId,
        driverId,
        commanderId || null,
        isMainVehicle,
        status
    ];

    const result = await pool.query(query, values);

    return result.rows[0] || null;
}


// ========================================
// Delete Assignment
// ========================================

async function deleteAssignment(id) {

    const query = `
        DELETE FROM mission_vehicle_assignments
        WHERE id = $1
        RETURNING *;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
}


module.exports = {
    createAssignment,
    findAssignmentById,
    findAssignmentsByMissionId,
    findMainAssignment,
    updateAssignment,
    deleteAssignment
};