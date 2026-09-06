const pool = require("../../../config/db");

const missionRepository = require("../repositories/missionRepository");
const missionRunRepository = require("../repositories/missionRunRepository");

const {
    MISSION_STATUS
} = require("../domain/missionStatus");


// ========================================
// Start Mission Run
// ========================================

async function startMissionRun(missionId) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");


        // ------------------------------------
        // Lock Mission
        // ------------------------------------

        const missionResult = await client.query(
            `
            SELECT *
            FROM missions
            WHERE id = $1
            FOR UPDATE;
            `,
            [missionId]
        );

        const mission = missionResult.rows[0];


        if (!mission) {

            const error = new Error("Mission not found");

            error.statusCode = 404;

            throw error;
        }


        // ------------------------------------
        // Mission Status
        // ------------------------------------

        if (mission.status !== MISSION_STATUS.READY) {

            const error = new Error(
                "Mission can only be started when status is READY"
            );

            error.statusCode = 400;

            throw error;
        }


        // ------------------------------------
        // Update Mission
        // ------------------------------------

        const updatedMission =
            await missionRepository.updateMissionStatus(
                missionId,
                MISSION_STATUS.RUNNING,
                client
            );


        // ------------------------------------
        // Create Mission Run
        // ------------------------------------

        const missionRun =
            await missionRunRepository.createMissionRun(
                {
                    missionId
                },
                client
            );


        await client.query("COMMIT");


        return {
            mission: updatedMission,
            missionRun
        };

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
}


// ========================================
// Get Mission Run
// ========================================

async function getMissionRunById(id) {

    const missionRun =
        await missionRunRepository.findMissionRunById(id);


    if (!missionRun) {

        const error =
            new Error("Mission run not found");

        error.statusCode = 404;

        throw error;
    }


    return missionRun;
}


// ========================================
// Get Mission Runs By Mission
// ========================================

async function getMissionRunsByMissionId(missionId) {

    const mission =
        await missionRepository.findMissionById(missionId);


    if (!mission) {

        const error =
            new Error("Mission not found");

        error.statusCode = 404;

        throw error;
    }


    return await missionRunRepository
        .findMissionRunsByMissionId(missionId);
}


// ========================================
// Complete Mission Run
// ========================================

async function completeMissionRun(missionRunId) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");


        // ------------------------------------
        // Lock Mission Run
        // ------------------------------------

        const missionRunResult =
            await client.query(
                `
                SELECT *
                FROM mission_runs
                WHERE id = $1
                FOR UPDATE;
                `,
                [missionRunId]
            );

        const missionRun =
            missionRunResult.rows[0];


        if (!missionRun) {

            const error =
                new Error("Mission run not found");

            error.statusCode = 404;

            throw error;
        }


        // ------------------------------------
        // Mission
        // ------------------------------------

        const missionResult =
            await client.query(
                `
                SELECT *
                FROM missions
                WHERE id = $1
                FOR UPDATE;
                `,
                [missionRun.mission_id]
            );

        const mission =
            missionResult.rows[0];


        if (!mission) {

            const error =
                new Error("Mission not found");

            error.statusCode = 404;

            throw error;
        }


        // ------------------------------------
        // Mission Run Status
        // ------------------------------------

        if (
            missionRun.status !==
            MISSION_STATUS.RUNNING
        ) {

            const error =
                new Error(
                    "Mission run can only be completed when status is RUNNING"
                );

            error.statusCode = 400;

            throw error;
        }


        // ------------------------------------
        // Mission Status
        // ------------------------------------

        if (
            mission.status !==
            MISSION_STATUS.RUNNING
        ) {

            const error =
                new Error(
                    "Mission can only be completed when status is RUNNING"
                );

            error.statusCode = 400;

            throw error;
        }


        // ------------------------------------
        // Complete Mission Run
        // ------------------------------------

        const updatedMissionRun =
            await missionRunRepository.updateMissionRunStatus(
                missionRunId,
                MISSION_STATUS.COMPLETED,
                client
            );


        // ------------------------------------
        // Complete Mission
        // ------------------------------------

        const updatedMission =
            await missionRepository.updateMissionStatus(
                mission.id,
                MISSION_STATUS.COMPLETED,
                client
            );


        await client.query("COMMIT");


        return {
            mission: updatedMission,
            missionRun: updatedMissionRun
        };

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
}


// ========================================
// Abort Mission Run
// ========================================

async function abortMissionRun(missionRunId) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");


        // ------------------------------------
        // Lock Mission Run
        // ------------------------------------

        const missionRunResult =
            await client.query(
                `
                SELECT *
                FROM mission_runs
                WHERE id = $1
                FOR UPDATE;
                `,
                [missionRunId]
            );

        const missionRun =
            missionRunResult.rows[0];


        if (!missionRun) {

            const error =
                new Error("Mission run not found");

            error.statusCode = 404;

            throw error;
        }


        // ------------------------------------
        // Mission
        // ------------------------------------

        const missionResult =
            await client.query(
                `
                SELECT *
                FROM missions
                WHERE id = $1
                FOR UPDATE;
                `,
                [missionRun.mission_id]
            );

        const mission =
            missionResult.rows[0];


        if (!mission) {

            const error =
                new Error("Mission not found");

            error.statusCode = 404;

            throw error;
        }


        // ------------------------------------
        // Mission Run Status
        // ------------------------------------

        if (
            missionRun.status !==
            MISSION_STATUS.RUNNING
        ) {

            const error =
                new Error(
                    "Mission run can only be aborted when status is RUNNING"
                );

            error.statusCode = 400;

            throw error;
        }


        // ------------------------------------
        // Mission Status
        // ------------------------------------

        if (
            mission.status !==
            MISSION_STATUS.RUNNING
        ) {

            const error =
                new Error(
                    "Mission can only be aborted when status is RUNNING"
                );

            error.statusCode = 400;

            throw error;
        }


        // ------------------------------------
        // Abort Mission Run
        // ------------------------------------

        const updatedMissionRun =
            await missionRunRepository.updateMissionRunStatus(
                missionRunId,
                MISSION_STATUS.ABORTED,
                client
            );


        // ------------------------------------
        // Abort Mission
        // ------------------------------------

        const updatedMission =
            await missionRepository.updateMissionStatus(
                mission.id,
                MISSION_STATUS.ABORTED,
                client
            );


        await client.query("COMMIT");


        return {
            mission: updatedMission,
            missionRun: updatedMissionRun
        };

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
}


module.exports = {
    startMissionRun,
    getMissionRunById,
    getMissionRunsByMissionId,
    completeMissionRun,
    abortMissionRun
};
