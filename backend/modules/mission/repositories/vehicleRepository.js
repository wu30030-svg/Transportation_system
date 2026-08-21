const pool = require("../../../config/db");


// ========================================
// Create Vehicle
// ========================================

async function createVehicle({
    vehicleNumber,
    vehicleType,
    vehicleHeight,
    vehicleWidth,
    vehicleWeight,
    vehicleLoadType,
    status
}) {
    const query = `
        INSERT INTO vehicles (
            vehicle_number,
            vehicle_type,
            vehicle_height,
            vehicle_width,
            vehicle_weight,
            vehicle_load_type,
            status
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
        )
        RETURNING *;
    `;

    const values = [
        vehicleNumber,
        vehicleType,
        vehicleHeight ?? null,
        vehicleWidth ?? null,
        vehicleWeight ?? null,
        vehicleLoadType || null,
        status || "AVAILABLE"
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
}


// ========================================
// Find Vehicle By ID
// ========================================

async function findVehicleById(id) {

    const query = `
        SELECT *
        FROM vehicles
        WHERE id = $1;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
}


// ========================================
// Find All Vehicles
// ========================================

async function findAllVehicles() {

    const query = `
        SELECT *
        FROM vehicles
        ORDER BY created_at DESC;
    `;

    const result = await pool.query(query);

    return result.rows;
}


// ========================================
// Update Vehicle
// ========================================

async function updateVehicle(
    id,
    {
        vehicleNumber,
        vehicleType,
        vehicleHeight,
        vehicleWidth,
        vehicleWeight,
        vehicleLoadType,
        status
    }
) {

    const query = `
        UPDATE vehicles
        SET
            vehicle_number = $1,
            vehicle_type = $2,
            vehicle_height = $3,
            vehicle_width = $4,
            vehicle_weight = $5,
            vehicle_load_type = $6,
            status = $7,
            updated_at = NOW()
        WHERE id = $8
        RETURNING *;
    `;

    const values = [
        vehicleNumber,
        vehicleType,
        vehicleHeight ?? null,
        vehicleWidth ?? null,
        vehicleWeight ?? null,
        vehicleLoadType || null,
        status,
        id
    ];

    const result = await pool.query(query, values);

    return result.rows[0] || null;
}


// ========================================
// Delete Vehicle
// ========================================

async function deleteVehicle(id) {

    const query = `
        DELETE FROM vehicles
        WHERE id = $1
        RETURNING *;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
}


module.exports = {
    createVehicle,
    findVehicleById,
    findAllVehicles,
    updateVehicle,
    deleteVehicle
};