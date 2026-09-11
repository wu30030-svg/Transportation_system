const missionMonitoringRepository =
    require("../repositories/missionMonitoringRepository");

const missionRepository =
    require("../repositories/missionRepository");

const pool = require("../../../config/db");


// ========================================
// Mission Status Rules
// ========================================

const EDITABLE_MISSION_STATUSES = [
    "DRAFT",
    "PLANNED",
    "READY",
    "RUNNING"
];


// ========================================
// Create Mission Monitoring
// ========================================

async function createMonitoring(data) {

    const {
        missionId,
        cameraId
    } = data;


    // ------------------------------------
    // Mission
    // ------------------------------------

    const mission =
        await missionRepository.findMissionById(missionId);

    if (!mission) {

        const error = new Error("Mission not found");

        error.statusCode = 404;

        throw error;
    }


    // ------------------------------------
    // Mission Status
    // ------------------------------------

    if (!EDITABLE_MISSION_STATUSES.includes(mission.status)) {

        const error = new Error(
            "Mission monitoring cannot be created in current mission status"
        );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------
    // Camera
    // ------------------------------------

    const cameraResult = await pool.query(
        `
        SELECT
            camera_id
        FROM cameras
        WHERE camera_id = $1;
        `,
        [cameraId]
    );

    if (cameraResult.rows.length === 0) {

        const error = new Error("Camera not found");

        error.statusCode = 404;

        throw error;
    }


    // ------------------------------------
    // Duplicate Check
    // ------------------------------------

    const existingResult = await pool.query(
        `
        SELECT
            id
        FROM mission_monitoring
        WHERE mission_id = $1
          AND camera_id = $2;
        `,
        [
            missionId,
            cameraId
        ]
    );

    if (existingResult.rows.length > 0) {

        const error = new Error(
            "Camera is already assigned to mission monitoring"
        );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------
    // Create
    // ------------------------------------

    return await missionMonitoringRepository.createMonitoring({
        missionId,
        cameraId
    });
}

// ========================================
// Delete Mission Monitoring
// ========================================

async function deleteMonitoring(data) {

    const {
        missionId,
        monitoringId
    } = data;


    // ------------------------------------
    // Mission
    // ------------------------------------

    const mission =
        await missionRepository.findMissionById(missionId);

    if (!mission) {

        const error = new Error("Mission not found");

        error.statusCode = 404;

        throw error;
    }


    // ------------------------------------
    // Mission Status
    // ------------------------------------

    if (!EDITABLE_MISSION_STATUSES.includes(mission.status)) {

        const error = new Error(
            "Mission monitoring cannot be deleted in current mission status"
        );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------
    // Monitoring
    // ------------------------------------

    const result =
        await missionMonitoringRepository.deleteMonitoring({
            missionId,
            monitoringId
        });


    if (!result) {

        const error = new Error(
            "Mission monitoring not found"
        );

        error.statusCode = 404;

        throw error;
    }


    // ------------------------------------
    // Return Deleted Monitoring
    // ------------------------------------

    return result;
}

// ========================================
// Pin Mission Monitoring
// ========================================

async function pinMonitoring(data) {

    const {
        missionId,
        monitoringId
    } = data;


    // ------------------------------------
    // Mission
    // ------------------------------------

    const mission =
        await missionRepository.findMissionById(missionId);

    if (!mission) {

        const error = new Error("Mission not found");

        error.statusCode = 404;

        throw error;
    }


    // ------------------------------------
    // Mission Status
    // ------------------------------------

    if (!EDITABLE_MISSION_STATUSES.includes(mission.status)) {

        const error = new Error(
            "Mission monitoring cannot be pinned in current mission status"
        );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------
    // Monitoring
    // ------------------------------------

    const result =
        await missionMonitoringRepository.pinMonitoring({
            missionId,
            monitoringId
        });


    if (!result) {

        const error = new Error(
            "Mission monitoring not found"
        );

        error.statusCode = 404;

        throw error;
    }


    // ------------------------------------
    // Return Pinned Monitoring
    // ------------------------------------

    return result;
}

// ========================================
// Unpin Mission Monitoring
// ========================================

async function unpinMonitoring(data) {

    const {
        missionId,
        monitoringId
    } = data;


    // ------------------------------------
    // Mission
    // ------------------------------------

    const mission =
        await missionRepository.findMissionById(missionId);

    if (!mission) {

        const error = new Error("Mission not found");

        error.statusCode = 404;

        throw error;
    }


    // ------------------------------------
    // Mission Status
    // ------------------------------------

    if (!EDITABLE_MISSION_STATUSES.includes(mission.status)) {

        const error = new Error(
            "Mission monitoring cannot be unpinned in current mission status"
        );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------
    // Monitoring
    // ------------------------------------

    const result =
        await missionMonitoringRepository.unpinMonitoring({
            missionId,
            monitoringId
        });


    if (!result) {

        const error = new Error(
            "Mission monitoring not found"
        );

        error.statusCode = 404;

        throw error;
    }


    // ------------------------------------
    // Return Unpinned Monitoring
    // ------------------------------------

    return result;
}

// ========================================
// Swap Mission Monitoring Order
// ========================================

async function swapMonitoring(data) {

    const {
        missionId,
        monitoringIdA,
        monitoringIdB
    } = data;


    // ------------------------------------
    // Mission
    // ------------------------------------

    const mission =
        await missionRepository.findMissionById(missionId);

    if (!mission) {

        const error = new Error(
            "Mission not found"
        );

        error.statusCode = 404;

        throw error;
    }


    // ------------------------------------
    // Mission Status
    // ------------------------------------

    if (!EDITABLE_MISSION_STATUSES.includes(mission.status)) {

        const error = new Error(
            "Mission monitoring cannot be reordered in current mission status"
        );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------
    // Swap Monitoring
    // ------------------------------------

    const result =
        await missionMonitoringRepository.swapMonitoring({
            missionId,
            monitoringIdA,
            monitoringIdB
        });


    // ------------------------------------
    // Monitoring Not Found
    // ------------------------------------

    if (!result) {

        const error = new Error(
            "Mission monitoring not found"
        );

        error.statusCode = 404;

        throw error;
    }


    // ------------------------------------
    // Return Swapped Monitorings
    // ------------------------------------

    return result;
}

// ========================================
// Get Mission Monitorings
// ========================================

async function getMonitoringsByMissionId(missionId) {

    // ------------------------------------
    // Mission
    // ------------------------------------

    const mission =
        await missionRepository.findMissionById(missionId);

    if (!mission) {

        const error = new Error("Mission not found");

        error.statusCode = 404;

        throw error;
    }


    // ------------------------------------
    // Get Monitorings
    // ------------------------------------

    return await missionMonitoringRepository
        .findMonitoringsByMissionId(missionId);
}


module.exports = {
    createMonitoring,
    deleteMonitoring,
    pinMonitoring,
    unpinMonitoring,
    swapMonitoring,
    getMonitoringsByMissionId
};