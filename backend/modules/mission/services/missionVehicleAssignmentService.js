const missionVehicleAssignmentRepository =
    require("../repositories/missionVehicleAssignmentRepository");

const missionRepository =
    require("../repositories/missionRepository");

const vehicleRepository =
    require("../repositories/vehicleRepository");

const personnelRepository =
    require("../repositories/personnelRepository");


// ========================================
// Create Mission Vehicle Assignment
// ========================================

async function createAssignment(data) {

    const {
        missionId,
        vehicleId,
        driverId,
        commanderId,
        isMainVehicle = false,
        status = "ASSIGNED"
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
    // Vehicle
    // ------------------------------------

    const vehicle =
        await vehicleRepository.findVehicleById(vehicleId);

    if (!vehicle) {
        const error = new Error("Vehicle not found");
        error.statusCode = 404;
        throw error;
    }

    if (vehicle.status !== "AVAILABLE") {
        const error =
            new Error("Vehicle is not available");

        error.statusCode = 400;
        throw error;
    }


    // ------------------------------------
    // Driver
    // ------------------------------------

    const driver =
        await personnelRepository.findPersonnelById(driverId);

    if (!driver) {
        const error = new Error("Driver not found");
        error.statusCode = 404;
        throw error;
    }

    if (driver.status !== "ACTIVE") {
        const error =
            new Error("Driver is not active");

        error.statusCode = 400;
        throw error;
    }


    // ------------------------------------
    // Commander
    // ------------------------------------

    if (commanderId) {

        if (commanderId === driverId) {
            const error =
                new Error(
                    "Driver and commander cannot be the same person"
                );

            error.statusCode = 400;
            throw error;
        }


        const commander =
            await personnelRepository.findPersonnelById(
                commanderId
            );

        if (!commander) {
            const error =
                new Error("Commander not found");

            error.statusCode = 404;
            throw error;
        }

        if (commander.status !== "ACTIVE") {
            const error =
                new Error("Commander is not active");

            error.statusCode = 400;
            throw error;
        }
    }


    // ------------------------------------
    // Main Vehicle
    // ------------------------------------

    if (isMainVehicle) {

        const existingMain =
            await missionVehicleAssignmentRepository
                .findMainAssignment(missionId);

        if (existingMain) {

            const error =
                new Error(
                    "Mission already has a main vehicle"
                );

            error.statusCode = 400;
            throw error;
        }
    }


    // ------------------------------------
    // Create
    // ------------------------------------

    return await missionVehicleAssignmentRepository
        .createAssignment({
            missionId,
            vehicleId,
            driverId,
            commanderId,
            isMainVehicle,
            status
        });
}


// ========================================
// Get Assignment
// ========================================

async function getAssignmentById(id) {

    const assignment =
        await missionVehicleAssignmentRepository
            .findAssignmentById(id);

    if (!assignment) {
        const error =
            new Error("Mission vehicle assignment not found");

        error.statusCode = 404;
        throw error;
    }

    return assignment;
}


// ========================================
// Get Mission Assignments
// ========================================

async function getAssignmentsByMissionId(missionId) {

    const mission =
        await missionRepository.findMissionById(missionId);

    if (!mission) {
        const error =
            new Error("Mission not found");

        error.statusCode = 404;
        throw error;
    }

    return await missionVehicleAssignmentRepository
        .findAssignmentsByMissionId(missionId);
}


// ========================================
// Update Assignment
// ========================================

async function updateAssignment(id, data) {

    const existing =
        await missionVehicleAssignmentRepository
            .findAssignmentById(id);

    if (!existing) {
        const error =
            new Error("Mission vehicle assignment not found");

        error.statusCode = 404;
        throw error;
    }

    return await missionVehicleAssignmentRepository
        .updateAssignment(
            id,
            data
        );
}


// ========================================
// Delete Assignment
// ========================================

async function deleteAssignment(id) {

    const existing =
        await missionVehicleAssignmentRepository
            .findAssignmentById(id);

    if (!existing) {
        const error =
            new Error("Mission vehicle assignment not found");

        error.statusCode = 404;
        throw error;
    }

    return await missionVehicleAssignmentRepository
        .deleteAssignment(id);
}


module.exports = {
    createAssignment,
    getAssignmentById,
    getAssignmentsByMissionId,
    updateAssignment,
    deleteAssignment
};