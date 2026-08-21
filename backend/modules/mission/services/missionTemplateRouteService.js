const missionTemplateRepository =
    require("../repositories/missionTemplateRepository");

const missionTemplateRouteRepository =
    require("../repositories/missionTemplateRouteRepository");


/**
 * 建立 Mission Template Route
 */
async function createTemplateRoute(templateId, data) {

    // 1. 確認 Template 存在
    const template =
        await missionTemplateRepository.findTemplateById(templateId);

    if (!template) {
        throw new Error("Mission template not found");
    }


    // 2. 確認尚未存在 Route
    const existingRoute =
        await missionTemplateRouteRepository.findTemplateRoute(templateId);

    if (existingRoute) {
        throw new Error("Template already has a route");
    }


    // 3. 確認 Geometry
    if (
        !data.geometry ||
        !Array.isArray(data.geometry) ||
        data.geometry.length === 0
    ) {
        throw new Error("Route geometry is required");
    }


    // 4. 建立 Route
    return await missionTemplateRouteRepository.createTemplateRoute({
        templateId,

        startName: data.startName,
        startLatitude: data.startLatitude,
        startLongitude: data.startLongitude,

        endName: data.endName,
        endLatitude: data.endLatitude,
        endLongitude: data.endLongitude,

        vehicleType: data.vehicleType,
        vehicleHeight: data.vehicleHeight,
        vehicleWidth: data.vehicleWidth,
        vehicleWeight: data.vehicleWeight,
        vehicleLoadType: data.vehicleLoadType,

        geometry: data.geometry,

        distanceMeters: data.distanceMeters,
        durationSeconds: data.durationSeconds,

        source: data.source || "CUSTOM",
        confirmed: data.confirmed ?? false
    });
}


/**
 * 取得 Template Route
 */
async function getTemplateRoute(templateId) {

    const template =
        await missionTemplateRepository.findTemplateById(templateId);

    if (!template) {
        throw new Error("Mission template not found");
    }

    return await missionTemplateRouteRepository.findTemplateRoute(
        templateId
    );
}


/**
 * 更新 Template Route
 */
async function updateTemplateRoute(templateId, data) {

    const template =
        await missionTemplateRepository.findTemplateById(templateId);

    if (!template) {
        throw new Error("Mission template not found");
    }


    const existingRoute =
        await missionTemplateRouteRepository.findTemplateRoute(templateId);

    if (!existingRoute) {
        throw new Error("Template route not found");
    }


    if (
        data.geometry !== undefined &&
        (
            !Array.isArray(data.geometry) ||
            data.geometry.length === 0
        )
    ) {
        throw new Error("Route geometry cannot be empty");
    }


    return await missionTemplateRouteRepository.updateTemplateRoute(
        templateId,
        data
    );
}


module.exports = {
    createTemplateRoute,
    getTemplateRoute,
    updateTemplateRoute
};