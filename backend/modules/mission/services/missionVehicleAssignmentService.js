const missionVehicleAssignmentRepository = require("../repositories/missionVehicleAssignmentRepository");
const missionRepository = require("../repositories/missionRepository");
const vehicleRepository = require("../repositories/vehicleRepository");
const personnelRepository = require("../repositories/personnelRepository");

// ========================================
// Mission Status Rules
// ========================================

const EDITABLE_MISSION_STATUSES = [
    "DRAFT",
    "PLANNED"
];


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

    const mission = await missionRepository.findMissionById(missionId);

    if (!mission) {
        const error = new Error("Mission not found");
        error.statusCode = 404;
        throw error;
    }

    if (!EDITABLE_MISSION_STATUSES.includes(mission.status)) {
        const error = new Error(
            "Mission vehicle assignment cannot be created in current mission status"
        );

        error.statusCode = 400;
        throw error;
    }


    // ------------------------------------
    // Vehicle
    // ------------------------------------

    const vehicle = await vehicleRepository.findVehicleById(vehicleId);

    if (!vehicle) {
        const error = new Error("Vehicle not found");
        error.statusCode = 404;
        throw error;
    }

    if (vehicle.status !== "AVAILABLE") {
        const error = new Error("Vehicle is not available");

        error.statusCode = 400;
        throw error;
    }


    // ------------------------------------
    // Driver
    // ------------------------------------

    const driver = await personnelRepository.findPersonnelById(driverId);

    if (!driver) {
        const error = new Error("Driver not found");
        error.statusCode = 404;
        throw error;
    }

    if (driver.status !== "ACTIVE") {
        const error = new Error("Driver is not active");

        error.statusCode = 400;
        throw error;
    }

    // ------------------------------------
    // Driver Assignment
    // ------------------------------------

    const existingDriverAssignment = await missionVehicleAssignmentRepository.findDriverAssignment(driverId);

    if (existingDriverAssignment) {

        const error = new Error(
            "Driver is already assigned to another mission vehicle"
        );

        error.statusCode = 400;

        throw error;
    }

    // ------------------------------------
    // Commander
    // ------------------------------------

    if (commanderId) {

        if (commanderId === driverId) {
            const error = new Error(
                "Driver and commander cannot be the same person"
            );

            error.statusCode = 400;
            throw error;
        }


        const commander = await personnelRepository.findPersonnelById(commanderId);

        if (!commander) {
            const error = new Error("Commander not found");

            error.statusCode = 404;
            throw error;
        }

        if (commander.status !== "ACTIVE") {
            const error = new Error("Commander is not active");

            error.statusCode = 400;
            throw error;
        }
    }


    // ------------------------------------
    // Main Vehicle
    // ------------------------------------

    if (isMainVehicle) {

        const existingMain = await missionVehicleAssignmentRepository.findMainAssignment(missionId);

        if (existingMain) {

            const error = new Error(
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

    const assignment = await missionVehicleAssignmentRepository.findAssignmentById(id);

    if (!assignment) {
        const error = new Error("Mission vehicle assignment not found");

        error.statusCode = 404;
        throw error;
    }

    return assignment;
}


// ========================================
// Get Mission Assignments
// ========================================

async function getAssignmentsByMissionId(missionId) {

    const mission = await missionRepository.findMissionById(missionId);

    if (!mission) {
        const error = new Error("Mission not found");

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

    const existing = await missionVehicleAssignmentRepository.findAssignmentById(id);

    if (!existing) {
        const error = new Error("Mission vehicle assignment not found");

        error.statusCode = 404;
        throw error;
    }


    // ------------------------------------
    // Mission
    // ------------------------------------

    const mission = await missionRepository.findMissionById(existing.mission_id);

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
            "Mission vehicle assignment cannot be modified in current mission status"
        );

        error.statusCode = 400;

        throw error;
    }

    // ------------------------------------
    // Vehicle
    // ------------------------------------

    if (data.vehicleId !== undefined) {

        const vehicle = await vehicleRepository.findVehicleById(data.vehicleId);

        if (!vehicle) {
            const error = new Error("Vehicle not found");

            error.statusCode = 404;
            throw error;
        }

        // 如果選擇的是目前 Assignment 原本使用的車輛
        // 即使目前狀態是 ASSIGNED，也允許繼續使用
        const isCurrentVehicle =
            vehicle.id === existing.vehicle_id;

        if (!isCurrentVehicle && vehicle.status !== "AVAILABLE") {

            const error = new Error(
                "Vehicle is not available"
            );

            error.statusCode = 400;

            throw error;
        }
    }


    // ------------------------------------
    // Driver
    // ------------------------------------

    const finalDriverId = data.driverId !== undefined ? data.driverId : existing.driver_id;

    const driver = await personnelRepository.findPersonnelById(finalDriverId);

    if (!driver) {
        const error = new Error("Driver not found");

        error.statusCode = 404;
        throw error;
    }

    if (driver.status !== "ACTIVE") {
        const error = new Error("Driver is not active");

        error.statusCode = 400;
        throw error;
    }

    // ------------------------------------
    // Driver Duplicate Check
    // ------------------------------------

    const existingDriverAssignment =
        await missionVehicleAssignmentRepository.findAssignmentByMissionAndDriver(
            existing.mission_id,
            finalDriverId
        );

    if (
        existingDriverAssignment &&
        existingDriverAssignment.id !== id
    ) {
        const error = new Error(
            "Driver is already assigned to another vehicle in this mission"
        );

        error.statusCode = 400;

        throw error;
    }

    // ------------------------------------
    // Commander
    // ------------------------------------

    let finalCommanderId;

    if (data.commanderId !== undefined) {
        finalCommanderId = data.commanderId;
    } else {
        finalCommanderId = existing.commander_id;
    }

    if (finalCommanderId) {

        if (finalCommanderId === finalDriverId) {
            const error = new Error(
                "Driver and commander cannot be the same person"
            );

            error.statusCode = 400;
            throw error;
        }

        const commander = await personnelRepository.findPersonnelById(finalCommanderId);

        if (!commander) {
            const error = new Error("Commander not found");

            error.statusCode = 404;
            throw error;
        }

        if (commander.status !== "ACTIVE") {
            const error = new Error("Commander is not active");

            error.statusCode = 400;
            throw error;
        }
    }

    // ------------------------------------
    // Update
    // ------------------------------------

    return await missionVehicleAssignmentRepository.updateAssignment(id, {
        vehicleId: data.vehicleId !== undefined ? data.vehicleId : existing.vehicle_id,

        driverId: data.driverId !== undefined ? data.driverId : existing.driver_id,

        commanderId: data.commanderId !== undefined ? data.commanderId : existing.commander_id,

        isMainVehicle: data.isMainVehicle !== undefined ? data.isMainVehicle : existing.is_main_vehicle,

        status: data.status !== undefined ? data.status : existing.status
    }
    );
}

// ========================================
// Delete Assignment
// ========================================

async function deleteAssignment(id) {

    const existing = await missionVehicleAssignmentRepository.findAssignmentById(id);

    if (!existing) {
        const error = new Error("Mission vehicle assignment not found");

        error.statusCode = 404;
        throw error;
    }

    // ------------------------------------
    // Mission
    // ------------------------------------

    const mission = await missionRepository.findMissionById(existing.mission_id);

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
            "Mission vehicle assignment cannot be deleted in current mission status"
        );

        error.statusCode = 400;

        throw error;
    }

    // ------------------------------------
    // Delete
    // ------------------------------------

    return await missionVehicleAssignmentRepository.deleteAssignment(id);
}


module.exports = {
    createAssignment,
    getAssignmentById,
    getAssignmentsByMissionId,
    updateAssignment,
    deleteAssignment
};