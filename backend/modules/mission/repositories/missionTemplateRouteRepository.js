const pool = require("../../../config/db");


// ========================================
// 建立 Mission Template Route
// ========================================

async function createTemplateRoute({
    templateId,

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
}) {

    const query = `
        INSERT INTO mission_template_routes (
            template_id,

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
            $2, $3, $4,
            $5, $6, $7,
            $8, $9, $10, $11, $12,
            $13,
            $14, $15,
            $16, $17
        )
        RETURNING *;
    `;

    const values = [
        templateId,

        startName || null,
        startLatitude ?? null,
        startLongitude ?? null,

        endName || null,
        endLatitude ?? null,
        endLongitude ?? null,

        vehicleType || null,
        vehicleHeight ?? null,
        vehicleWidth ?? null,
        vehicleWeight ?? null,
        vehicleLoadType || null,

        JSON.stringify(geometry),

        distanceMeters ?? null,
        durationSeconds ?? null,

        source || "CUSTOM",
        confirmed ?? false
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
}


// ========================================
// 取得 Template Route
// ========================================

async function findTemplateRoute(templateId) {

    const query = `
        SELECT *
        FROM mission_template_routes
        WHERE template_id = $1;
    `;

    const result = await pool.query(query, [templateId]);

    return result.rows[0] || null;
}


// ========================================
// 更新 Template Route
// ========================================

async function updateTemplateRoute(
    templateId,
    {
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
    }
) {

    const query = `
        UPDATE mission_template_routes
        SET

            start_name = $1,
            start_latitude = $2,
            start_longitude = $3,

            end_name = $4,
            end_latitude = $5,
            end_longitude = $6,

            vehicle_type = $7,
            vehicle_height = $8,
            vehicle_width = $9,
            vehicle_weight = $10,
            vehicle_load_type = $11,

            geometry = $12,

            distance_meters = $13,
            duration_seconds = $14,

            source = $15,
            confirmed = $16,

            updated_at = NOW()

        WHERE template_id = $17

        RETURNING *;
    `;

    const values = [
        startName || null,
        startLatitude ?? null,
        startLongitude ?? null,

        endName || null,
        endLatitude ?? null,
        endLongitude ?? null,

        vehicleType || null,
        vehicleHeight ?? null,
        vehicleWidth ?? null,
        vehicleWeight ?? null,
        vehicleLoadType || null,

        JSON.stringify(geometry),

        distanceMeters ?? null,
        durationSeconds ?? null,

        source || "CUSTOM",
        confirmed ?? false,

        templateId
    ];

    const result = await pool.query(query, values);

    return result.rows[0] || null;
}


// ========================================
// 刪除 Template Route
// ========================================

async function deleteTemplateRoute(templateId) {

    const query = `
        DELETE FROM mission_template_routes
        WHERE template_id = $1
        RETURNING *;
    `;

    const result = await pool.query(query, [templateId]);

    return result.rows[0] || null;
}


module.exports = {
    createTemplateRoute,
    findTemplateRoute,
    updateTemplateRoute,
    deleteTemplateRoute
};