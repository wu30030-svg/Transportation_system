const pool = require("../../../config/db");


// ========================================
// Create Tracking Location
// ========================================

async function createTrackingLocation(
    {
        missionRunId,
        personnelId,
        latitude,
        longitude,
        accuracy,
        recordedAt
    },
    db = pool
) {

    const query = `
        INSERT INTO tracking_locations (
            mission_run_id,
            personnel_id,
            latitude,
            longitude,
            accuracy,
            recorded_at
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            COALESCE($6::timestamptz, NOW())
        )
        RETURNING *;
    `;

    const result = await db.query(
        query,
        [
            missionRunId,
            personnelId,
            latitude,
            longitude,
            accuracy ?? null,
            recordedAt ?? null
        ]
    );

    return result.rows[0];
}


// ========================================
// Find Tracking Locations By Mission Run
// ========================================

async function findLocationsByMissionRunId(
    missionRunId,
    db = pool
) {

    const query = `
        SELECT
            tl.*,

            json_build_object(
                'id', p.id,
                'personnel_number', p.personnel_number,
                'name', p.name
            ) AS personnel

        FROM tracking_locations AS tl

        INNER JOIN personnel AS p
            ON p.id = tl.personnel_id

        WHERE tl.mission_run_id = $1

        ORDER BY
            tl.recorded_at ASC;
    `;

    const result = await db.query(
        query,
        [missionRunId]
    );

    return result.rows;
}


// ========================================
// Find Current Locations By Mission
// ========================================

async function findCurrentLocationsByMissionId(
    missionId,
    db = pool
) {

    const query = `
        WITH latest_personnel_locations AS (
            SELECT DISTINCT ON (tl.personnel_id)
                tl.*
            FROM tracking_locations AS tl

            INNER JOIN mission_runs AS mr
                ON mr.id = tl.mission_run_id

            WHERE mr.mission_id = $1
              AND mr.status = 'RUNNING'

            ORDER BY
                tl.personnel_id,
                tl.recorded_at DESC
        )

        SELECT
            lpl.id AS tracking_location_id,
            lpl.mission_run_id,
            lpl.personnel_id,
            lpl.latitude,
            lpl.longitude,
            lpl.accuracy,
            lpl.recorded_at,

            p.personnel_number,
            p.name AS personnel_name,

            mva.id AS assignment_id,
            mva.vehicle_id,
            mva.is_main_vehicle,

            v.vehicle_number,
            v.vehicle_type

        FROM latest_personnel_locations AS lpl

        INNER JOIN personnel AS p
            ON p.id = lpl.personnel_id

        INNER JOIN mission_vehicle_assignments AS mva
            ON mva.mission_id = $1
           AND mva.driver_id = lpl.personnel_id

        INNER JOIN vehicles AS v
            ON v.id = mva.vehicle_id

        WHERE mva.status = 'ASSIGNED'

        ORDER BY
            mva.is_main_vehicle DESC,
            v.vehicle_number ASC;
    `;

    const result = await db.query(
        query,
        [missionId]
    );

    return result.rows;
}


// ========================================
// Find Running Assignment By Personnel
// ========================================

async function findRunningAssignmentByPersonnelId(
    missionRunId,
    personnelId,
    db = pool
) {

    const query = `
        SELECT
            mva.*,

            v.vehicle_number,
            v.vehicle_type,

            mr.status AS mission_run_status,
            mr.mission_id

        FROM mission_runs AS mr

        INNER JOIN mission_vehicle_assignments AS mva
            ON mva.mission_id = mr.mission_id

        INNER JOIN vehicles AS v
            ON v.id = mva.vehicle_id

        WHERE mr.id = $1
          AND mr.status = 'RUNNING'
          AND mva.driver_id = $2
          AND mva.status = 'ASSIGNED'

        LIMIT 1;
    `;

    const result = await db.query(
        query,
        [
            missionRunId,
            personnelId
        ]
    );

    return result.rows[0] || null;
}

async function upsertShuttleLocation({
    personnelId,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    recordedAt
}, db = pool) {
    const query = `
        INSERT INTO shuttle_locations (
            personnel_id,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            recorded_at,
            updated_at
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            COALESCE($7::timestamptz, NOW()),
            NOW()
        )
        ON CONFLICT (personnel_id)
        DO UPDATE SET
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            accuracy = EXCLUDED.accuracy,
            speed = EXCLUDED.speed,
            heading = EXCLUDED.heading,
            recorded_at = EXCLUDED.recorded_at,
            updated_at = NOW()
        RETURNING *;
    `;

    const result = await db.query(query, [
        personnelId,
        latitude,
        longitude,
        accuracy ?? null,
        speed ?? null,
        heading ?? null,
        recordedAt ?? null
    ]);

    return result.rows[0];
}


async function findCurrentShuttleLocations(
    accessContext,
    db = pool
) {
    const query = `
        SELECT
            sl.id AS tracking_location_id,
            sl.personnel_id,
            sl.latitude,
            sl.longitude,
            sl.accuracy,
            sl.speed,
            sl.heading,
            sl.recorded_at,
            sl.updated_at,

            p.personnel_number,
            p.name AS personnel_name

        FROM shuttle_locations AS sl

        INNER JOIN personnel AS p
            ON p.id = sl.personnel_id

        INNER JOIN users AS u
            ON u.id = p.user_id

        WHERE u.access_context = $1
          AND sl.updated_at >= NOW() - INTERVAL '30 seconds'

        ORDER BY
            p.personnel_number ASC;
    `;

    const result = await db.query(query, [
        accessContext
    ]);

    return result.rows;
}

module.exports = {
    createTrackingLocation,
    findLocationsByMissionRunId,
    findCurrentLocationsByMissionId,
    findRunningAssignmentByPersonnelId,
    upsertShuttleLocation,
    findCurrentShuttleLocations
};