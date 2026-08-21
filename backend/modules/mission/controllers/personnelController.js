const personnelService =
    require("../services/personnelService");


// ========================================
// Create Personnel
// ========================================

async function createPersonnel(req, res) {

    try {

        const personnel =
            await personnelService.createPersonnel(
                req.body
            );

        return res.status(201).json({
            success: true,
            data: personnel
        });

    } catch (error) {

        console.error(
            "Create Personnel Error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Internal Server Error"
        });
    }
}


// ========================================
// Get Personnel By ID
// ========================================

async function getPersonnelById(req, res) {

    try {

        const { id } = req.params;

        const personnel =
            await personnelService.getPersonnelById(
                id
            );

        return res.status(200).json({
            success: true,
            data: personnel
        });

    } catch (error) {

        console.error(
            "Get Personnel Error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Internal Server Error"
        });
    }
}


// ========================================
// Get All Personnel
// ========================================

async function getAllPersonnel(req, res) {

    try {

        const personnel =
            await personnelService.getAllPersonnel();

        return res.status(200).json({
            success: true,
            data: personnel
        });

    } catch (error) {

        console.error(
            "Get Personnel List Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal Server Error"
        });
    }
}


// ========================================
// Update Personnel
// ========================================

async function updatePersonnel(req, res) {

    try {

        const { id } = req.params;

        const personnel =
            await personnelService.updatePersonnel(
                id,
                req.body
            );

        return res.status(200).json({
            success: true,
            data: personnel
        });

    } catch (error) {

        console.error(
            "Update Personnel Error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Internal Server Error"
        });
    }
}


// ========================================
// Delete Personnel
// ========================================

async function deletePersonnel(req, res) {

    try {

        const { id } = req.params;

        const personnel =
            await personnelService.deletePersonnel(
                id
            );

        return res.status(200).json({
            success: true,
            data: personnel
        });

    } catch (error) {

        console.error(
            "Delete Personnel Error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Internal Server Error"
        });
    }
}


module.exports = {
    createPersonnel,
    getPersonnelById,
    getAllPersonnel,
    updatePersonnel,
    deletePersonnel
};