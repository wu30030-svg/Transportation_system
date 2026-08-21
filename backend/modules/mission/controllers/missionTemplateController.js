const missionTemplateService =
    require("../services/missionTemplateService");


// 建立 Mission Template
async function createTemplate(req, res) {

    try {

        const template =
            await missionTemplateService.createTemplate(req.body);

        return res.status(201).json({
            success: true,
            data: template
        });

    } catch (error) {

        console.error("createTemplate error:", error);

        if (error.message === "Template name is required") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create mission template"
        });
    }
}


// 取得所有 Mission Templates
async function getAllTemplates(req, res) {

    try {

        const templates =
            await missionTemplateService.getAllTemplates();

        return res.json({
            success: true,
            data: templates
        });

    } catch (error) {

        console.error("getAllTemplates error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get mission templates"
        });
    }
}


// 取得單一 Mission Template
async function getTemplateById(req, res) {

    try {

        const { id } = req.params;

        const template =
            await missionTemplateService.getTemplateById(id);

        return res.json({
            success: true,
            data: template
        });

    } catch (error) {

        console.error("getTemplateById error:", error);

        if (error.message === "Mission template not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to get mission template"
        });
    }
}


// 更新 Mission Template
async function updateTemplate(req, res) {

    try {

        const { id } = req.params;

        const template =
            await missionTemplateService.updateTemplate(
                id,
                req.body
            );

        return res.json({
            success: true,
            data: template
        });

    } catch (error) {

        console.error("updateTemplate error:", error);

        if (error.message === "Mission template not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === "Template name is required") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update mission template"
        });
    }
}


// 刪除 Mission Template
async function deleteTemplate(req, res) {

    try {

        const { id } = req.params;

        const template =
            await missionTemplateService.deleteTemplate(id);

        return res.json({
            success: true,
            data: template
        });

    } catch (error) {

        console.error("deleteTemplate error:", error);

        if (error.message === "Mission template not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to delete mission template"
        });
    }
}


module.exports = {
    createTemplate,
    getAllTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate
};