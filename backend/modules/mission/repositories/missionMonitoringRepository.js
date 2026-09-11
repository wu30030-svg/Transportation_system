const pool = require("../../../config/db");


// ========================================
// Create Mission Monitoring
// ========================================

async function createMonitoring({
    missionId,
    cameraId
}) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");
        // ------------------------------------
        // Lock Mission Row
        // ------------------------------------

        await client.query(
            `
    SELECT
        id
    FROM missions
    WHERE id = $1
    FOR UPDATE;
    `,
            [missionId]
        );


        // ------------------------------------
        // Get Current Last Display Order
        // ------------------------------------

        const orderResult = await client.query(
            `
    SELECT
        COALESCE(MAX(display_order), 0) AS max_display_order
    FROM mission_monitoring
    WHERE mission_id = $1;
    `,
            [missionId]
        );


        const nextDisplayOrder =
            Number(orderResult.rows[0].max_display_order) + 1;


        // ------------------------------------
        // Create Monitoring
        // ------------------------------------

        const monitoringResult = await client.query(
            `
            INSERT INTO mission_monitoring (
                mission_id,
                camera_id,
                display_order,
                is_pinned
            )
            VALUES (
                $1,
                $2,
                $3,
                false
            )
            RETURNING *;
            `,
            [
                missionId,
                cameraId,
                nextDisplayOrder
            ]
        );


        await client.query("COMMIT");

        return monitoringResult.rows[0];

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
}

// ========================================
// Delete Mission Monitoring
// ========================================

async function deleteMonitoring({
    missionId,
    monitoringId
}) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        // ------------------------------------
        // Lock Mission Row
        // ------------------------------------

        await client.query(
            `
            SELECT
                id
            FROM missions
            WHERE id = $1
            FOR UPDATE;
            `,
            [missionId]
        );

        // ------------------------------------
        // Delete Monitoring
        // ------------------------------------

        const deleteResult = await client.query(
            `
            DELETE FROM mission_monitoring
            WHERE id = $1
              AND mission_id = $2
            RETURNING id;
            `,
            [
                monitoringId,
                missionId
            ]
        );

        // ------------------------------------
        // Reorder Remaining Monitorings
        // ------------------------------------

        await client.query(
            `
            WITH reordered AS (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        ORDER BY display_order ASC, created_at ASC
                    ) AS new_display_order
                FROM mission_monitoring
                WHERE mission_id = $1
            )
            UPDATE mission_monitoring mm
            SET
                display_order = reordered.new_display_order,
                updated_at = now()
            FROM reordered
            WHERE mm.id = reordered.id;
            `,
            [missionId]
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

// ========================================
// Pin Mission Monitoring
// ========================================

async function pinMonitoring({
    missionId,
    monitoringId
}) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        // ------------------------------------
        // Lock Mission Row
        // ------------------------------------

        await client.query(
            `
            SELECT
                id
            FROM missions
            WHERE id = $1
            FOR UPDATE;
            `,
            [missionId]
        );

        // ------------------------------------
        // Check Monitoring
        // ------------------------------------

        const monitoringResult = await client.query(
            `
            SELECT
                id,
                is_pinned
            FROM mission_monitoring
            WHERE id = $1
              AND mission_id = $2;
            `,
            [
                monitoringId,
                missionId
            ]
        );

        if (monitoringResult.rows.length === 0) {

            await client.query("COMMIT");

            return null;
        }

        // ------------------------------------
        // Move Selected Monitoring To Top
        // ------------------------------------

        await client.query(
            `
            UPDATE mission_monitoring
            SET
                display_order = display_order + 1,
                updated_at = now()
            WHERE mission_id = $1
              AND id <> $2;
            `,
            [
                missionId,
                monitoringId
            ]
        );

        await client.query(
            `
            UPDATE mission_monitoring
            SET
                display_order = 1,
                is_pinned = true,
                updated_at = now()
            WHERE id = $1
              AND mission_id = $2
            RETURNING *;
            `,
            [
                monitoringId,
                missionId
            ]
        );

        // ------------------------------------
        // Rebuild Display Order
        // ------------------------------------

        const reorderResult = await client.query(
            `
            WITH reordered AS (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        ORDER BY display_order ASC, created_at ASC
                    ) AS new_display_order
                FROM mission_monitoring
                WHERE mission_id = $1
            )
            UPDATE mission_monitoring mm
            SET
                display_order = reordered.new_display_order,
                updated_at = now()
            FROM reordered
            WHERE mm.id = reordered.id
            RETURNING mm.*;
            `,
            [missionId]
        );

        await client.query("COMMIT");

        return reorderResult.rows.find(
            row => row.id === monitoringId
        ) || null;

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
}

// ========================================
// Unpin Mission Monitoring
// ========================================

async function unpinMonitoring({
    missionId,
    monitoringId
}) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        // ------------------------------------
        // Lock Mission Row
        // ------------------------------------

        await client.query(
            `
            SELECT
                id
            FROM missions
            WHERE id = $1
            FOR UPDATE;
            `,
            [missionId]
        );

        // ------------------------------------
        // Check Monitoring
        // ------------------------------------

        const monitoringResult = await client.query(
            `
            SELECT
                id,
                is_pinned
            FROM mission_monitoring
            WHERE id = $1
              AND mission_id = $2;
            `,
            [
                monitoringId,
                missionId
            ]
        );

        if (monitoringResult.rows.length === 0) {

            await client.query("COMMIT");

            return null;
        }

        // ------------------------------------
        // Remove Pin
        // ------------------------------------

        await client.query(
            `
            UPDATE mission_monitoring
            SET
                is_pinned = false,
                updated_at = now()
            WHERE id = $1
              AND mission_id = $2;
            `,
            [
                monitoringId,
                missionId
            ]
        );

        // ------------------------------------
        // Move Selected Monitoring To End
        // ------------------------------------

        const reorderResult = await client.query(
            `
            WITH reordered AS (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        ORDER BY
                            is_pinned DESC,
                            CASE
                                WHEN id = $2 THEN 1
                                ELSE 0
                            END ASC,
                            display_order ASC,
                            created_at ASC
                    ) AS new_display_order
                FROM mission_monitoring
                WHERE mission_id = $1
            )
            UPDATE mission_monitoring mm
            SET
                display_order = reordered.new_display_order,
                updated_at = now()
            FROM reordered
            WHERE mm.id = reordered.id
            RETURNING mm.*;
            `,
            [
                missionId,
                monitoringId
            ]
        );

        await client.query("COMMIT");

        return reorderResult.rows.find(
            row => row.id === monitoringId
        ) || null;

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
}

// ========================================
// Swap Mission Monitoring Order
// ========================================

async function swapMonitoring({
    missionId,
    monitoringIdA,
    monitoringIdB
}) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        // ------------------------------------
        // Check Same Monitoring
        // ------------------------------------

        if (monitoringIdA === monitoringIdB) {

            const error = new Error(
                "Cannot swap the same monitoring"
            );

            error.statusCode = 400;

            throw error;
        }

        // ------------------------------------
        // Lock Mission Row
        // ------------------------------------

        await client.query(
            `
            SELECT
                id
            FROM missions
            WHERE id = $1
            FOR UPDATE;
            `,
            [missionId]
        );

        // ------------------------------------
        // Get Both Monitorings
        // ------------------------------------

        const monitoringResult = await client.query(
            `
            SELECT
                id,
                mission_id,
                display_order,
                is_pinned
            FROM mission_monitoring
            WHERE mission_id = $1
              AND id IN ($2, $3)
            FOR UPDATE;
            `,
            [
                missionId,
                monitoringIdA,
                monitoringIdB
            ]
        );

        // ------------------------------------
        // Both Monitorings Must Exist
        // ------------------------------------

        if (monitoringResult.rows.length !== 2) {

            await client.query("ROLLBACK");

            return null;
        }

        const monitoringA =
            monitoringResult.rows.find(
                row => row.id === monitoringIdA
            );

        const monitoringB =
            monitoringResult.rows.find(
                row => row.id === monitoringIdB
            );

        // ------------------------------------
        // Must Be In Same Pin Zone
        // ------------------------------------

        if (
            monitoringA.is_pinned !==
            monitoringB.is_pinned
        ) {

            const error = new Error(
                "Cannot swap pinned and unpinned monitoring"
            );

            error.statusCode = 400;

            throw error;
        }

        // ------------------------------------
        // Swap Display Order
        // ------------------------------------

        await client.query(
            `
            UPDATE mission_monitoring
            SET
                display_order = CASE
                    WHEN id = $2 THEN $4::integer
                    WHEN id = $3 THEN $5::integer
                END,
                updated_at = now()
            WHERE mission_id = $1
              AND id IN ($2, $3);
            `,
            [
                missionId,
                monitoringIdA,
                monitoringIdB,
                monitoringB.display_order,
                monitoringA.display_order
            ]
        );

        // ------------------------------------
        // Get Updated Monitorings
        // ------------------------------------

        const result = await client.query(
            `
            SELECT
                id,
                mission_id,
                camera_id,
                display_order,
                is_pinned,
                created_at,
                updated_at
            FROM mission_monitoring
            WHERE mission_id = $1
              AND id IN ($2, $3)
            ORDER BY display_order ASC;
            `,
            [
                missionId,
                monitoringIdA,
                monitoringIdB
            ]
        );

        await client.query("COMMIT");

        return result.rows;

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
}

// ========================================
// Find Mission Monitorings
// ========================================

async function findMonitoringsByMissionId(missionId) {

    const result = await pool.query(
        `
        SELECT
            mm.id,
            mm.mission_id,
            mm.camera_id,
            mm.display_order,
            mm.is_pinned,
            mm.created_at,
            mm.updated_at,

            c.camera_name,
            c.latitude,
            c.longitude,
            c.camera_url

        FROM mission_monitoring mm

        INNER JOIN cameras c
            ON c.camera_id = mm.camera_id

        WHERE mm.mission_id = $1

        ORDER BY mm.display_order ASC;
        `,
        [missionId]
    );

    return result.rows;
}

module.exports = {
    createMonitoring,
    deleteMonitoring,
    pinMonitoring,
    unpinMonitoring,
    swapMonitoring,
    findMonitoringsByMissionId
};