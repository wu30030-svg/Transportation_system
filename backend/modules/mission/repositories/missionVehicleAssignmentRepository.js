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

    const client = await pool.connect();

    try {

        await client.query("BEGIN");


        // ------------------------------------
        // Lock Vehicle
        // ------------------------------------

        const vehicleResult = await client.query(
            `
            SELECT *
            FROM vehicles
            WHERE id = $1
            FOR UPDATE;
            `,
            [vehicleId]
        );

        const vehicle = vehicleResult.rows[0];

        if (!vehicle) {

            const error =
                new Error("Vehicle not found");

            error.statusCode = 404;

            throw error;
        }


        // ------------------------------------
        // Vehicle Availability
        // ------------------------------------

        if (vehicle.status !== "AVAILABLE") {

            const error =
                new Error("Vehicle is not available");

            error.statusCode = 400;

            throw error;
        }


        // ------------------------------------
        // Create Assignment
        // ------------------------------------

        const assignmentResult = await client.query(
            `
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
            `,
            [
                missionId,
                vehicleId,
                driverId,
                commanderId || null,
                isMainVehicle,
                status
            ]
        );


        // ------------------------------------
        // Update Vehicle Status
        // ------------------------------------

        await client.query(
            `
            UPDATE vehicles
            SET
                status = 'ASSIGNED',
                updated_at = NOW()
            WHERE id = $1;
            `,
            [vehicleId]
        );


        await client.query("COMMIT");

        return assignmentResult.rows[0];

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
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
        SELECT
            mva.*,

            -- ========================================
            -- Vehicle
            -- ========================================

            json_build_object(
                'id', v.id,
                'vehicle_number', v.vehicle_number,
                'vehicle_type', v.vehicle_type,
                'vehicle_height', v.vehicle_height,
                'vehicle_width', v.vehicle_width,
                'vehicle_weight', v.vehicle_weight,
                'vehicle_load_type', v.vehicle_load_type,
                'status', v.status
            ) AS vehicle,


            -- ========================================
            -- Driver
            -- ========================================

            CASE
                WHEN d.id IS NOT NULL THEN
                    json_build_object(
                        'id', d.id,
                        'personnel_number', d.personnel_number,
                        'name', d.name,
                        'status', d.status
                    )
                ELSE NULL
            END AS driver,


            -- ========================================
            -- Commander
            -- ========================================

            CASE
                WHEN c.id IS NOT NULL THEN
                    json_build_object(
                        'id', c.id,
                        'personnel_number', c.personnel_number,
                        'name', c.name,
                        'status', c.status
                    )
                ELSE NULL
            END AS commander


        FROM mission_vehicle_assignments AS mva


        -- ========================================
        -- Vehicle
        -- ========================================

        INNER JOIN vehicles AS v
            ON v.id = mva.vehicle_id


        -- ========================================
        -- Driver
        -- ========================================

        LEFT JOIN personnel AS d
            ON d.id = mva.driver_id


        -- ========================================
        -- Commander
        -- ========================================

        LEFT JOIN personnel AS c
            ON c.id = mva.commander_id


        WHERE mva.mission_id = $1


        ORDER BY
            mva.is_main_vehicle DESC,
            mva.created_at ASC;
    `;


    const result =
        await pool.query(
            query,
            [missionId]
        );


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
// Find Driver Assignment
// ========================================

async function findDriverAssignment(driverId) {

    const query = `
        SELECT *
        FROM mission_vehicle_assignments
        WHERE driver_id = $1
          AND status = 'ASSIGNED'
        LIMIT 1;
    `;

    const result =
        await pool.query(query, [driverId]);

    return result.rows[0] || null;
}

// ========================================
// Find Assignment By Mission And Driver
// ========================================

async function findAssignmentByMissionAndDriver(
    missionId,
    driverId
) {

    const query = `
        SELECT *
        FROM mission_vehicle_assignments
        WHERE mission_id = $1
          AND driver_id = $2
          AND status = 'ASSIGNED'
        LIMIT 1;
    `;

    const result =
        await pool.query(
            query,
            [
                missionId,
                driverId
            ]
        );

    return result.rows[0] || null;
}

// ========================================
// Update Mission Vehicle Assignment
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

    const client = await pool.connect();

    try {

        await client.query("BEGIN");


        // ------------------------------------
        // Lock Assignment
        // ------------------------------------

        const assignmentResult = await client.query(
            `
            SELECT *
            FROM mission_vehicle_assignments
            WHERE id = $1
            FOR UPDATE;
            `,
            [id]
        );

        const existingAssignment =
            assignmentResult.rows[0];

        if (!existingAssignment) {

            await client.query("ROLLBACK");

            return null;
        }


        // ------------------------------------
        // Determine Vehicle
        // ------------------------------------

        const oldVehicleId =
            existingAssignment.vehicle_id;

        const newVehicleId =
            vehicleId !== undefined
                ? vehicleId
                : oldVehicleId;


        // ------------------------------------
        // Vehicle Change
        // ------------------------------------

        if (newVehicleId !== oldVehicleId) {

            // --------------------------------
            // Lock New Vehicle
            // --------------------------------

            const newVehicleResult =
                await client.query(
                    `
                    SELECT *
                    FROM vehicles
                    WHERE id = $1
                    FOR UPDATE;
                    `,
                    [newVehicleId]
                );

            const newVehicle =
                newVehicleResult.rows[0];

            if (!newVehicle) {

                const error =
                    new Error("Vehicle not found");

                error.statusCode = 404;

                throw error;
            }


            // --------------------------------
            // New Vehicle Availability
            // --------------------------------

            if (newVehicle.status !== "AVAILABLE") {

                const error =
                    new Error("Vehicle is not available");

                error.statusCode = 400;

                throw error;
            }


            // --------------------------------
            // Release Old Vehicle
            // --------------------------------

            await client.query(
                `
                UPDATE vehicles
                SET
                    status = 'AVAILABLE',
                    updated_at = NOW()
                WHERE id = $1;
                `,
                [oldVehicleId]
            );


            // --------------------------------
            // Assign New Vehicle
            // --------------------------------

            await client.query(
                `
                UPDATE vehicles
                SET
                    status = 'ASSIGNED',
                    updated_at = NOW()
                WHERE id = $1;
                `,
                [newVehicleId]
            );
        }


        // ------------------------------------
        // Main Vehicle Switch
        // ------------------------------------

        if (
            isMainVehicle === true &&
            existingAssignment.is_main_vehicle !== true
        ) {

            // 先解除這個 Mission 原本的主車
            await client.query(
                `
                UPDATE mission_vehicle_assignments
                SET
                    is_main_vehicle = false,
                    updated_at = NOW()
                WHERE mission_id = $1
                  AND is_main_vehicle = true
                  AND id <> $2;
                `,
                [
                    existingAssignment.mission_id,
                    id
                ]
            );
        }


        // ------------------------------------
        // Update Assignment
        // ------------------------------------

        const assignmentUpdateResult =
            await client.query(
                `
                UPDATE mission_vehicle_assignments
                SET
                    vehicle_id = $1,
                    driver_id = $2,
                    commander_id = $3,
                    is_main_vehicle = $4,
                    status = $5,
                    updated_at = NOW()
                WHERE id = $6
                RETURNING *;
                `,
                [
                    newVehicleId,
                    driverId,
                    commanderId,
                    isMainVehicle,
                    status,
                    id
                ]
            );


        await client.query("COMMIT");

        return assignmentUpdateResult.rows[0] || null;

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
}

// ========================================
// Release Assignments By Mission
// ========================================
//
// 支援兩種模式：
//
// 1. 沒有傳 client
//    → 自己建立 transaction
//
// 2. 有傳 client
//    → 使用外部 transaction
//    → 讓 Mission Run Completion / Abort
//       可以與 Resource Release 共用同一個 transaction
//

async function releaseAssignmentsByMissionId(
    missionId,
    assignmentStatus,
    externalClient = null
) {

    const client =
        externalClient || await pool.connect();

    const ownTransaction =
        !externalClient;

    try {

        if (ownTransaction) {
            await client.query("BEGIN");
        }


        // ------------------------------------
        // Find Mission Assignments
        // ------------------------------------

        const assignmentResult =
            await client.query(
                `
                SELECT *
                FROM mission_vehicle_assignments
                WHERE mission_id = $1
                  AND status = 'ASSIGNED'
                FOR UPDATE;
                `,
                [missionId]
            );


        // ------------------------------------
        // Release Vehicles
        // ------------------------------------

        for (
            const assignment
            of assignmentResult.rows
        ) {

            await client.query(
                `
                UPDATE vehicles
                SET
                    status = 'AVAILABLE',
                    updated_at = NOW()
                WHERE id = $1
                  AND status = 'ASSIGNED';
                `,
                [assignment.vehicle_id]
            );
        }


        // ------------------------------------
        // Update Assignment Status
        // ------------------------------------

        const updatedAssignmentsResult =
            await client.query(
                `
                UPDATE mission_vehicle_assignments
                SET
                    status = $1,
                    updated_at = NOW()
                WHERE mission_id = $2
                  AND status = 'ASSIGNED'
                RETURNING *;
                `,
                [
                    assignmentStatus,
                    missionId
                ]
            );


        if (ownTransaction) {
            await client.query("COMMIT");
        }


        return updatedAssignmentsResult.rows;

    } catch (error) {

        if (ownTransaction) {
            await client.query("ROLLBACK");
        }

        throw error;

    } finally {

        if (ownTransaction) {
            client.release();
        }
    }
}

// ========================================
// Delete Assignment
// ========================================

async function deleteAssignment(id) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");


        // ------------------------------------
        // Find Assignment
        // ------------------------------------

        const assignmentResult = await client.query(
            `
            SELECT *
            FROM mission_vehicle_assignments
            WHERE id = $1
            FOR UPDATE;
            `,
            [id]
        );

        const assignment =
            assignmentResult.rows[0];

        if (!assignment) {

            await client.query("ROLLBACK");

            return null;
        }


        // ------------------------------------
        // Delete Assignment
        // ------------------------------------

        const deleteResult = await client.query(
            `
            DELETE FROM mission_vehicle_assignments
            WHERE id = $1
            RETURNING *;
            `,
            [id]
        );


        // ------------------------------------
        // Release Vehicle
        // ------------------------------------

        await client.query(
            `
            UPDATE vehicles
            SET
                status = 'AVAILABLE',
                updated_at = NOW()
            WHERE id = $1
              AND status = 'ASSIGNED';
            `,
            [assignment.vehicle_id]
        );


        await client.query("COMMIT");

        return deleteResult.rows[0] || null;

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
}


module.exports = {
    createAssignment,
    findAssignmentById,
    findAssignmentsByMissionId,
    findMainAssignment,
    findDriverAssignment,
    findAssignmentByMissionAndDriver,
    updateAssignment,
    releaseAssignmentsByMissionId,
    deleteAssignment
};