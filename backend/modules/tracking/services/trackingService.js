const trackingRepository = require("../repositories/trackingRepository");

const missionRunRepository =
    require("../../mission/repositories/missionRunRepository");


// ========================================
// Record Personnel GPS
// ========================================

async function recordLocation(
    {
        missionRunId,
        personnelId,
        latitude,
        longitude,
        accuracy,
        recordedAt
    }
) {

    if (!missionRunId) {

        const error =
            new Error("Mission run ID is required");

        error.statusCode = 400;

        throw error;
    }


    if (
        typeof latitude !== "number" ||
        Number.isNaN(latitude) ||
        latitude < -90 ||
        latitude > 90
    ) {

        const error =
            new Error("Invalid latitude");

        error.statusCode = 400;

        throw error;
    }


    if (
        typeof longitude !== "number" ||
        Number.isNaN(longitude) ||
        longitude < -180 ||
        longitude > 180
    ) {

        const error =
            new Error("Invalid longitude");

        error.statusCode = 400;

        throw error;
    }


    if (
        accuracy !== undefined &&
        accuracy !== null &&
        (
            typeof accuracy !== "number" ||
            Number.isNaN(accuracy) ||
            accuracy < 0
        )
    ) {

        const error =
            new Error("Invalid accuracy");

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------
    // Mission Run
    // ------------------------------------

    const missionRun =
        await missionRunRepository
            .findMissionRunById(missionRunId);


    if (!missionRun) {

        const error =
            new Error("Mission run not found");

        error.statusCode = 404;

        throw error;
    }


    if (missionRun.status !== "RUNNING") {

        const error =
            new Error(
                "Tracking location can only be recorded while mission run is RUNNING"
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------
    // Personnel → Mission Assignment
    // ------------------------------------

    const assignment =
        await trackingRepository
            .findRunningAssignmentByPersonnelId(
                missionRunId,
                personnelId
            );


    if (!assignment) {

        const error =
            new Error(
                "Personnel is not the driver of a vehicle in this mission run"
            );

        error.statusCode = 403;

        throw error;
    }


    // ------------------------------------
    // Create Location
    // ------------------------------------

    const location =
        await trackingRepository
            .createTrackingLocation({
                missionRunId,
                personnelId,
                latitude,
                longitude,
                accuracy,
                recordedAt
            });


    return {
        location,
        assignment: {
            id: assignment.id,
            mission_id: assignment.mission_id,
            vehicle_id: assignment.vehicle_id,
            vehicle_number: assignment.vehicle_number,
            vehicle_type: assignment.vehicle_type,
            is_main_vehicle: assignment.is_main_vehicle
        }
    };
}


// ========================================
// Get Mission Run Tracking
// ========================================

async function getMissionRunTracking(
    missionRunId
) {

    const missionRun =
        await missionRunRepository
            .findMissionRunById(missionRunId);


    if (!missionRun) {

        const error =
            new Error("Mission run not found");

        error.statusCode = 404;

        throw error;
    }


    return await trackingRepository
        .findLocationsByMissionRunId(
            missionRunId
        );
}


// ========================================
// Get Current Mission Vehicle Locations
// ========================================

async function getCurrentMissionLocations(
    missionId
) {

    return await trackingRepository
        .findCurrentLocationsByMissionId(
            missionId
        );
}

async function recordShuttleLocation({
    personnelId,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    recordedAt
}) {
    if (!personnelId) {
        const error =
            new Error("Personnel ID is required");

        error.statusCode = 400;
        throw error;
    }

    if (
        typeof latitude !== "number" ||
        Number.isNaN(latitude) ||
        latitude < -90 ||
        latitude > 90
    ) {
        const error =
            new Error("Invalid latitude");

        error.statusCode = 400;
        throw error;
    }

    if (
        typeof longitude !== "number" ||
        Number.isNaN(longitude) ||
        longitude < -180 ||
        longitude > 180
    ) {
        const error =
            new Error("Invalid longitude");

        error.statusCode = 400;
        throw error;
    }

    if (
        accuracy !== undefined &&
        accuracy !== null &&
        (
            typeof accuracy !== "number" ||
            Number.isNaN(accuracy) ||
            accuracy < 0
        )
    ) {
        const error =
            new Error("Invalid accuracy");

        error.statusCode = 400;
        throw error;
    }

    if (
        speed !== undefined &&
        speed !== null &&
        (
            typeof speed !== "number" ||
            Number.isNaN(speed) ||
            speed < 0
        )
    ) {
        const error =
            new Error("Invalid speed");

        error.statusCode = 400;
        throw error;
    }

    if (
        heading !== undefined &&
        heading !== null &&
        (
            typeof heading !== "number" ||
            Number.isNaN(heading) ||
            heading < 0 ||
            heading >= 360
        )
    ) {
        const error =
            new Error("Invalid heading");

        error.statusCode = 400;
        throw error;
    }

    return await trackingRepository.upsertShuttleLocation({
        personnelId,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        recordedAt
    });
}


async function getCurrentShuttleLocations() {
    return await trackingRepository.findCurrentShuttleLocations();
}

module.exports = {
    recordLocation,
    getMissionRunTracking,
    getCurrentMissionLocations,
    recordShuttleLocation,
    getCurrentShuttleLocations
};