const missionTemplateRouteService =
    require("../services/missionTemplateRouteService");


/**
 * 建立 Mission Template Route
 *
 * POST /api/mission-templates/:templateId/route
 */
async function createTemplateRoute(req, res) {

    try {

        const { templateId } = req.params;

        const route =
            await missionTemplateRouteService.createTemplateRoute(
                templateId,
                req.body
            );

        return res.status(201).json({
            success: true,
            data: route
        });

    } catch (error) {

        console.error(
            "createTemplateRoute error:",
            error
        );

        if (
            error.message === "Mission template not found" ||
            error.message === "Template already has a route"
        ) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (
            error.message === "Route geometry is required"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create template route"
        });
    }
}


/**
 * 取得 Mission Template Route
 *
 * GET /api/mission-templates/:templateId/route
 */
async function getTemplateRoute(req, res) {

    try {

        const { templateId } = req.params;

        const route =
            await missionTemplateRouteService.getTemplateRoute(
                templateId
            );

        if (!route) {
            return res.status(404).json({
                success: false,
                message: "Template route not found"
            });
        }

        return res.json({
            success: true,
            data: route
        });

    } catch (error) {

        console.error(
            "getTemplateRoute error:",
            error
        );

        if (
            error.message === "Mission template not found"
        ) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to get template route"
        });
    }
}


/**
 * 更新 Mission Template Route
 *
 * PATCH /api/mission-templates/:templateId/route
 */
async function updateTemplateRoute(req, res) {

    try {

        const { templateId } = req.params;

        const route =
            await missionTemplateRouteService.updateTemplateRoute(
                templateId,
                req.body
            );

        return res.json({
            success: true,
            data: route
        });

    } catch (error) {

        console.error(
            "updateTemplateRoute error:",
            error
        );

        if (
            error.message === "Mission template not found" ||
            error.message === "Template route not found"
        ) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (
            error.message === "Route geometry cannot be empty"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update template route"
        });
    }
}


module.exports = {
    createTemplateRoute,
    getTemplateRoute,
    updateTemplateRoute
};