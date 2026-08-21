const missionVehicleAssignmentService =
    require("../services/missionVehicleAssignmentService");


// ========================================
// Create Assignment
// ========================================

async function createAssignment(req, res) {

    try {

        const assignment =
            await missionVehicleAssignmentService
                .createAssignment(req.body);

        return res.status(201).json({
            success: true,
            data: assignment
        });

    } catch (error) {

        console.error(
            "Create Mission Vehicle Assignment Error:",
            error
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}


// ========================================
// Get Assignment By ID
// ========================================

async function getAssignmentById(req, res) {

    try {

        const { id } = req.params;

        const assignment =
            await missionVehicleAssignmentService
                .getAssignmentById(id);

        return res.status(200).json({
            success: true,
            data: assignment
        });

    } catch (error) {

        console.error(
            "Get Mission Vehicle Assignment Error:",
            error
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}


// ========================================
// Get Mission Assignments
// ========================================

async function getAssignmentsByMissionId(req, res) {

    try {

        const { missionId } = req.params;

        const assignments =
            await missionVehicleAssignmentService
                .getAssignmentsByMissionId(missionId);

        return res.status(200).json({
            success: true,
            data: assignments
        });

    } catch (error) {

        console.error(
            "Get Mission Vehicle Assignments Error:",
            error
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}


// ========================================
// Update Assignment
// ========================================

async function updateAssignment(req, res) {

    try {

        const { id } = req.params;

        const assignment =
            await missionVehicleAssignmentService
                .updateAssignment(
                    id,
                    req.body
                );

        return res.status(200).json({
            success: true,
            data: assignment
        });

    } catch (error) {

        console.error(
            "Update Mission Vehicle Assignment Error:",
            error
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}


// ========================================
// Delete Assignment
// ========================================

async function deleteAssignment(req, res) {

    try {

        const { id } = req.params;

        const assignment =
            await missionVehicleAssignmentService
                .deleteAssignment(id);

        return res.status(200).json({
            success: true,
            data: assignment
        });

    } catch (error) {

        console.error(
            "Delete Mission Vehicle Assignment Error:",
            error
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}


module.exports = {
    createAssignment,
    getAssignmentById,
    getAssignmentsByMissionId,
    updateAssignment,
    deleteAssignment
};