const pool = require('../../../config/db');

/**
 * 建立 Mission 的 Final Route
 */
async function createMissionRoute(data) {
    const {
        missionId,

        startName,
        startLatitude,
        startLongitude,

        endName,
        endLatitude,
        endLongitude,

        vehicleType,
        vehicleHeight,
        vehicleWidth,
        vehicleWeight,
        vehicleLoadType,

        geometry,

        distanceMeters,
        durationSeconds,

        source = 'AZURE',
        confirmed = false
    } = data;

    const query = `
        INSERT INTO mission_routes (
            mission_id,

            start_name,
            start_latitude,
            start_longitude,

            end_name,
            end_latitude,
            end_longitude,

            vehicle_type,
            vehicle_height,
            vehicle_width,
            vehicle_weight,
            vehicle_load_type,

            geometry,

            distance_meters,
            duration_seconds,

            source,
            confirmed
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16,
            $17
        )
        RETURNING *;
    `;

    const values = [
        missionId,

        startName,
        startLatitude,
        startLongitude,

        endName,
        endLatitude,
        endLongitude,

        vehicleType,
        vehicleHeight,
        vehicleWidth,
        vehicleWeight,
        vehicleLoadType,

        JSON.stringify(geometry),

        distanceMeters,
        durationSeconds,

        source,
        confirmed
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
}


/**
 * 取得 Mission 的 Final Route
 */
async function getMissionRoute(missionId) {

    const query = `
        SELECT *
        FROM mission_routes
        WHERE mission_id = $1
        LIMIT 1;
    `;

    const result = await pool.query(query, [missionId]);

    return result.rows[0] || null;
}


/**
 * 更新 Mission 的 Final Route
 */
async function updateMissionRoute(missionId, data) {

    const {
        startName,
        startLatitude,
        startLongitude,

        endName,
        endLatitude,
        endLongitude,

        vehicleType,
        vehicleHeight,
        vehicleWidth,
        vehicleWeight,
        vehicleLoadType,

        geometry,

        distanceMeters,
        durationSeconds,

        source,
        confirmed
    } = data;

    const query = `
        UPDATE mission_routes
        SET
            start_name = COALESCE($2, start_name),
            start_latitude = COALESCE($3, start_latitude),
            start_longitude = COALESCE($4, start_longitude),

            end_name = COALESCE($5, end_name),
            end_latitude = COALESCE($6, end_latitude),
            end_longitude = COALESCE($7, end_longitude),

            vehicle_type = COALESCE($8, vehicle_type),
            vehicle_height = COALESCE($9, vehicle_height),
            vehicle_width = COALESCE($10, vehicle_width),
            vehicle_weight = COALESCE($11, vehicle_weight),
            vehicle_load_type = COALESCE($12, vehicle_load_type),

            geometry = COALESCE($13, geometry),

            distance_meters = COALESCE($14, distance_meters),
            duration_seconds = COALESCE($15, duration_seconds),

            source = COALESCE($16, source),
            confirmed = COALESCE($17, confirmed),

            updated_at = NOW()

        WHERE mission_id = $1

        RETURNING *;
    `;

    const values = [
        missionId,

        startName,
        startLatitude,
        startLongitude,

        endName,
        endLatitude,
        endLongitude,

        vehicleType,
        vehicleHeight,
        vehicleWidth,
        vehicleWeight,
        vehicleLoadType,

        geometry ? JSON.stringify(geometry) : null,

        distanceMeters,
        durationSeconds,

        source,
        confirmed
    ];

    const result = await pool.query(query, values);

    return result.rows[0] || null;
}


module.exports = {
    createMissionRoute,
    getMissionRoute,
    updateMissionRoute
};