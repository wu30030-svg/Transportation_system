const missionRouteService = require('../services/missionRouteService');


/**
 * 建立 Mission Final Route
 *
 * POST /api/missions/:missionId/route
 */
async function createMissionRoute(req, res) {

    try {

        const { id: missionId } = req.params;

        const route = await missionRouteService.createMissionRoute(
            missionId,
            req.body
        );

        return res.status(201).json({
            success: true,
            data: route
        });

    } catch (error) {

        console.error('createMissionRoute error:', error);

        if (error.message === 'Mission not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === 'Mission already has a final route') {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === 'Route geometry is required') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to create mission route'
        });
    }
}


/**
 * 取得 Mission Final Route
 *
 * GET /api/missions/:missionId/route
 */
async function getMissionRoute(req, res) {

    try {

        const { id: missionId } = req.params;

        const route =
            await missionRouteService.getMissionRoute(missionId);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Mission route not found'
            });
        }

        return res.json({
            success: true,
            data: route
        });

    } catch (error) {

        console.error('getMissionRoute error:', error);

        if (error.message === 'Mission not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to get mission route'
        });
    }
}


/**
 * 更新 Mission Final Route
 *
 * PATCH /api/missions/:missionId/route
 */
async function updateMissionRoute(req, res) {

    try {

        const { id: missionId } = req.params;

        const route =
            await missionRouteService.updateMissionRoute(
                missionId,
                req.body
            );

        return res.json({
            success: true,
            data: route
        });

    } catch (error) {

        console.error('updateMissionRoute error:', error);

        if (
            error.message === 'Mission not found' ||
            error.message === 'Mission route not found'
        ) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === 'Route geometry cannot be empty') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to update mission route'
        });
    }
}


module.exports = {
    createMissionRoute,
    getMissionRoute,
    updateMissionRoute
};