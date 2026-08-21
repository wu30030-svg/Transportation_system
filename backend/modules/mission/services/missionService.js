const missionRepository = require("../repositories/missionRepository");
const missionTemplateRepository = require("../repositories/missionTemplateRepository");
const missionTemplateRouteRepository = require("../repositories/missionTemplateRouteRepository");
const missionRouteRepository = require("../repositories/missionRouteRepository");
const missionVehicleAssignmentRepository = require("../repositories/missionVehicleAssignmentRepository");
const {
    MISSION_STATUS,
    canTransition
} = require("../domain/missionStatus");

// 建立 Mission
async function createMission(data) {
    if (!data.missionName || data.missionName.trim() === "") {
        throw new Error("Mission name is required");
    }

    const mission = await missionRepository.createMission({
        missionName: data.missionName.trim(),
        description: data.description,
        purpose: data.purpose,
        startTime: data.startTime,
        createdBy: data.createdBy
    });

    return mission;
}

// ========================================
// Create Mission From Template
// ========================================

// ========================================
// Create Mission From Template
// ========================================

async function createMissionFromTemplate(templateId, data) {

    // 1. 找 Template
    const template =
        await missionTemplateRepository.findTemplateById(
            templateId
        );

    if (!template) {
        const error = new Error("Mission template not found");
        error.statusCode = 404;
        throw error;
    }

    // 2. 驗證 Mission Name
    if (
        !data.missionName ||
        data.missionName.trim() === ""
    ) {
        const error = new Error("Mission name is required");
        error.statusCode = 400;
        throw error;
    }

    // 3. 建立新的 Mission
    const mission =
        await missionRepository.createMission({

            missionName:
                data.missionName.trim(),

            description:
                data.description !== undefined
                    ? data.description
                    : template.description,

            purpose:
                data.purpose !== undefined
                    ? data.purpose
                    : template.purpose,

            startTime:
                data.startTime,

            createdBy:
                data.createdBy
        });

    // 4. 找 Template Route
    const templateRoute =
        await missionTemplateRouteRepository.findTemplateRoute(
            templateId
        );

    // 5. 如果 Template 有 Route
    //    就複製成新的 Mission Final Route
    if (templateRoute) {

        await missionRouteRepository.createMissionRoute({

            missionId:
                mission.id,

            startName:
                templateRoute.start_name,

            startLatitude:
                templateRoute.start_latitude,

            startLongitude:
                templateRoute.start_longitude,

            endName:
                templateRoute.end_name,

            endLatitude:
                templateRoute.end_latitude,

            endLongitude:
                templateRoute.end_longitude,

            vehicleType:
                templateRoute.vehicle_type,

            vehicleHeight:
                templateRoute.vehicle_height,

            vehicleWidth:
                templateRoute.vehicle_width,

            vehicleWeight:
                templateRoute.vehicle_weight,

            vehicleLoadType:
                templateRoute.vehicle_load_type,

            geometry:
                templateRoute.geometry,

            distanceMeters:
                templateRoute.distance_meters,

            durationSeconds:
                templateRoute.duration_seconds,

            source:
                templateRoute.source,

            confirmed:
                templateRoute.confirmed
        });
    }

    return mission;
}


// 取得單一 Mission
async function getMissionById(id) {
    const mission = await missionRepository.findMissionById(id);

    if (!mission) {
        const error = new Error("Mission not found");
        error.statusCode = 404;
        throw error;
    }

    return mission;
}

// 取得 Mission 列表
async function getAllMissions() {
    return await missionRepository.findAllMissions();
}

// 更新 Mission
async function updateMission(id, data) {
    // 先確認 Mission 是否存在
    const existingMission = await missionRepository.findMissionById(id);

    if (!existingMission) {
        const error = new Error("Mission not found");
        error.statusCode = 404;
        throw error;
    }

    // 目前只允許修改 DRAFT 任務
    if (existingMission.status !== "DRAFT") {
        const error = new Error("Only DRAFT missions can be edited");
        error.statusCode = 400;
        throw error;
    }

    // 確認任務名稱
    if (!data.missionName || data.missionName.trim() === "") {
        const error = new Error("Mission name is required");
        error.statusCode = 400;
        throw error;
    }

    const mission = await missionRepository.updateMission(
        id,
        {
            missionName: data.missionName.trim(),
            description: data.description,
            purpose: data.purpose,
            startTime: data.startTime
        }
    );

    return mission;
}

// ========================================
// Validate Mission Ready
// ========================================

async function validateMissionReady(missionId) {

    const mission =
        await missionRepository.findMissionById(missionId);

    if (!mission) {
        const error = new Error("Mission not found");
        error.statusCode = 404;
        throw error;
    }

    // 1. Mission 基本資料
    if (
        !mission.mission_name ||
        !mission.start_time
    ) {
        const error =
            new Error("Mission basic information is incomplete");

        error.statusCode = 400;
        throw error;
    }

    // 2. Route
    const missionRoute =
        await missionRouteRepository.getMissionRoute(missionId);

    if (!missionRoute) {
        const error =
            new Error("Mission route is required");

        error.statusCode = 400;
        throw error;
    }

    // 3. Route confirmation
    if (missionRoute.confirmed !== true) {
        const error =
            new Error("Mission route must be confirmed");

        error.statusCode = 400;
        throw error;
    }

    // 4. Vehicle Assignments
    const assignments =
        await missionVehicleAssignmentRepository
            .findAssignmentsByMissionId(missionId);

    if (!assignments || assignments.length === 0) {
        const error =
            new Error("At least one vehicle assignment is required");

        error.statusCode = 400;
        throw error;
    }

    // 5. Main Vehicle
    const mainAssignment =
        await missionVehicleAssignmentRepository
            .findMainAssignment(missionId);

    if (!mainAssignment) {
        const error =
            new Error("Main vehicle is required");

        error.statusCode = 400;
        throw error;
    }

    // 6. Driver
    if (!mainAssignment.driver_id) {
        const error =
            new Error("Main vehicle driver is required");

        error.statusCode = 400;
        throw error;
    }

    return true;
}

// 更新 Mission Status
async function updateMissionStatus(id, newStatus) {
    // 取得目前 Mission
    const mission = await missionRepository.findMissionById(id);

    if (!mission) {
        const error = new Error("Mission not found");
        error.statusCode = 404;
        throw error;
    }

    // 確認新的 Status 是否存在
    if (!Object.values(MISSION_STATUS).includes(newStatus)) {
        const error = new Error("Invalid mission status");
        error.statusCode = 400;
        throw error;
    }

    // 確認狀態轉換是否合法
    if (!canTransition(mission.status, newStatus)) {
        const error = new Error(
            `Invalid status transition: ${mission.status} -> ${newStatus}`
        );

        error.statusCode = 400;
        throw error;
    }

    if (newStatus === MISSION_STATUS.READY) {
        await validateMissionReady(id);
    }

    // 更新 Status
    const updatedMission =
        await missionRepository.updateMissionStatus(
            id,
            newStatus
        );

    return updatedMission;
}

module.exports = {
    createMission,
    createMissionFromTemplate,
    getMissionById,
    getAllMissions,
    updateMission,
    updateMissionStatus,
    validateMissionReady
};