const missionTemplateRepository = require("../repositories/missionTemplateRepository");
const missionTemplateRouteRepository = require("../repositories/missionTemplateRouteRepository");
const missionRepository = require("../repositories/missionRepository");
const missionRouteRepository = require("../repositories/missionRouteRepository");


// 建立 Mission Template
async function createTemplate(data) {

    if (!data.templateName || data.templateName.trim() === "") {
        throw new Error("Template name is required");
    }

    return await missionTemplateRepository.createTemplate({
        templateName: data.templateName.trim(),
        description: data.description,
        purpose: data.purpose,
        createdBy: data.createdBy
    });
}


// 取得單一 Mission Template
async function getTemplateById(id) {

    const template =
        await missionTemplateRepository.findTemplateById(id);

    if (!template) {
        throw new Error("Mission template not found");
    }

    return template;
}


// 取得所有 Mission Templates
async function getAllTemplates() {

    return await missionTemplateRepository.findAllTemplates();
}


// 更新 Mission Template
async function updateTemplate(id, data) {

    const existing =
        await missionTemplateRepository.findTemplateById(id);

    if (!existing) {
        throw new Error("Mission template not found");
    }

    if (
        data.templateName !== undefined &&
        data.templateName.trim() === ""
    ) {
        throw new Error("Template name is required");
    }

    return await missionTemplateRepository.updateTemplate(
        id,
        {
            templateName:
                data.templateName !== undefined
                    ? data.templateName.trim()
                    : existing.template_name,

            description:
                data.description !== undefined
                    ? data.description
                    : existing.description,

            purpose:
                data.purpose !== undefined
                    ? data.purpose
                    : existing.purpose
        }
    );
}


// 刪除 Mission Template
async function deleteTemplate(id) {

    const existing =
        await missionTemplateRepository.findTemplateById(id);

    if (!existing) {
        throw new Error("Mission template not found");
    }

    return await missionTemplateRepository.deleteTemplate(id);
}

// ========================================
// Create Mission From Template
// ========================================

async function createMissionFromTemplate(
    templateId,
    data
) {

    // 1. 取得 Template
    const template =
        await missionTemplateRepository.findTemplateById(
            templateId
        );

    if (!template) {
        throw new Error("Mission template not found");
    }


    // 2. 取得 Template Route
    const templateRoute =
        await missionTemplateRouteRepository.findTemplateRoute(
            templateId
        );

    if (!templateRoute) {
        throw new Error("Template route not found");
    }


    // 3. 驗證 Mission 名稱
    if (
        !data.missionName ||
        data.missionName.trim() === ""
    ) {
        throw new Error("Mission name is required");
    }


    // 4. 建立新的 Mission
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


    // 5. 複製 Template Route
    const missionRoute =
        await missionRouteRepository.createMissionRoute({

            missionId: mission.id,

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


    // 6. 回傳 Mission + Final Route
    return {
        mission,
        route: missionRoute
    };
}

module.exports = {
    createTemplate,
    getTemplateById,
    getAllTemplates,
    updateTemplate,
    deleteTemplate,
    createMissionFromTemplate
};