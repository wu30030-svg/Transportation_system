const missionService = require("../services/missionService");

// 建立 Mission
async function createMission(req, res) {
    try {
        const mission = await missionService.createMission(req.body);

        res.status(201).json({
            success: true,
            data: mission
        });
    } catch (error) {
        console.error("Create Mission Error:", error);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}


// 取得單一 Mission
async function getMissionById(req, res) {
    try {
        const { id } = req.params;

        const mission = await missionService.getMissionById(id);

        res.status(200).json({
            success: true,
            data: mission
        });
    } catch (error) {
        console.error("Get Mission Error:", error);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}

// 取得 Mission 列表
async function getAllMissions(req, res) {
    try {
        const missions = await missionService.getAllMissions();

        res.status(200).json({
            success: true,
            data: missions
        });
    } catch (error) {
        console.error("Get Missions Error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}

// 更新 Mission
async function updateMission(req, res) {
    try {
        const { id } = req.params;

        const mission = await missionService.updateMission(
            id,
            req.body
        );

        res.status(200).json({
            success: true,
            data: mission
        });
    } catch (error) {
        console.error("Update Mission Error:", error);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}

// 更新 Mission Status
async function updateMissionStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const mission = await missionService.updateMissionStatus(
            id,
            status
        );

        res.status(200).json({
            success: true,
            data: mission
        });
    } catch (error) {
        console.error("Update Mission Status Error:", error);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}

// ========================================
// Create Mission From Template
// ========================================

async function createMissionFromTemplate(req, res) {

    try {

        const { templateId } = req.params;

        const mission =
            await missionService.createMissionFromTemplate(
                templateId,
                req.body
            );

        return res.status(201).json({
            success: true,
            data: mission
        });

    } catch (error) {

        console.error(
            "Create Mission From Template Error:",
            error
        );

        res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Failed to create mission from template"
        });
    }
}

module.exports = {
    createMission,
    getMissionById,
    getAllMissions,
    updateMission,
    updateMissionStatus,
    createMissionFromTemplate
};