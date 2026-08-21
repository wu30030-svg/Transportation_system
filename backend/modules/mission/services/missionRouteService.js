const missionRepository = require('../repositories/missionRepository');
const missionRouteRepository = require('../repositories/missionRouteRepository');
const missionTemplateRouteRepository =require('../repositories/missionTemplateRouteRepository');

/**
 * 建立 Mission Final Route
 */
async function createMissionRoute(missionId, data) {

    // 1. 確認 Mission 存在
    const mission = await missionRepository.findMissionById(missionId);

    if (!mission) {
        throw new Error('Mission not found');
    }

    // 2. 確認是否已經有 Final Route
    const existingRoute =
        await missionRouteRepository.getMissionRoute(missionId);

    if (existingRoute) {
        throw new Error('Mission already has a final route');
    }

    // 3. Geometry 必須存在
    if (
        !data.geometry ||
        !Array.isArray(data.geometry) ||
        data.geometry.length === 0
    ) {
        throw new Error('Route geometry is required');
    }

    // 4. 建立 Route
    return await missionRouteRepository.createMissionRoute({
        missionId,

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

        source: data.source || 'AZURE',
        confirmed: data.confirmed ?? false
    });
}


/**
 * 取得 Mission Final Route
 */
async function getMissionRoute(missionId) {

    const mission = await missionRepository.findMissionById(missionId);

    if (!mission) {
        throw new Error('Mission not found');
    }

    return await missionRouteRepository.getMissionRoute(missionId);
}


/**
 * 更新 Mission Final Route
 */
async function updateMissionRoute(missionId, data) {

    const mission = await missionRepository.findMissionById(missionId);

    if (!mission) {
        throw new Error('Mission not found');
    }

    const existingRoute =
        await missionRouteRepository.getMissionRoute(missionId);

    if (!existingRoute) {
        throw new Error('Mission route not found');
    }

    if (
        data.geometry !== undefined &&
        (
            !Array.isArray(data.geometry) ||
            data.geometry.length === 0
        )
    ) {
        throw new Error('Route geometry cannot be empty');
    }

    return await missionRouteRepository.updateMissionRoute(
        missionId,
        data
    );
}

/**
 * ========================================
 * Create Mission Route From Template
 * ========================================
 */
async function createMissionRouteFromTemplate(
    missionId,
    templateId
) {

    // 1. 確認 Mission 存在
    const mission =
        await missionRepository.findMissionById(missionId);

    if (!mission) {
        throw new Error('Mission not found');
    }

    // 2. 確認 Mission 尚未有 Route
    const existingRoute =
        await missionRouteRepository.getMissionRoute(missionId);

    if (existingRoute) {
        throw new Error('Mission already has a final route');
    }

    // 3. 取得 Template Route
    const templateRoute =
        await missionTemplateRouteRepository.findTemplateRoute(
            templateId
        );

    if (!templateRoute) {
        throw new Error('Template route not found');
    }

    // 4. 複製 Template Route
    return await missionRouteRepository.createMissionRoute({

        missionId,

        startName: templateRoute.start_name,
        startLatitude: templateRoute.start_latitude,
        startLongitude: templateRoute.start_longitude,

        endName: templateRoute.end_name,
        endLatitude: templateRoute.end_latitude,
        endLongitude: templateRoute.end_longitude,

        vehicleType: templateRoute.vehicle_type,
        vehicleHeight: templateRoute.vehicle_height,
        vehicleWidth: templateRoute.vehicle_width,
        vehicleWeight: templateRoute.vehicle_weight,
        vehicleLoadType: templateRoute.vehicle_load_type,

        geometry: templateRoute.geometry,

        distanceMeters: templateRoute.distance_meters,
        durationSeconds: templateRoute.duration_seconds,

        source: templateRoute.source,
        confirmed: templateRoute.confirmed
    });
}


module.exports = {
    createMissionRoute,
    createMissionRouteFromTemplate,
    getMissionRoute,
    updateMissionRoute
};