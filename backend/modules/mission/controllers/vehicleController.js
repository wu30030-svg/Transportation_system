const vehicleService =
    require("../services/vehicleService");


// ========================================
// Create Vehicle
// ========================================

async function createVehicle(req, res) {

    try {

        const vehicle =
            await vehicleService.createVehicle(req.body);

        return res.status(201).json({
            success: true,
            data: vehicle
        });

    } catch (error) {

        console.error(
            "Create Vehicle Error:",
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
// Get Vehicle By ID
// ========================================

async function getVehicleById(req, res) {

    try {

        const { id } = req.params;

        const vehicle =
            await vehicleService.getVehicleById(id);

        return res.status(200).json({
            success: true,
            data: vehicle
        });

    } catch (error) {

        console.error(
            "Get Vehicle Error:",
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
// Get All Vehicles
// ========================================

async function getAllVehicles(req, res) {

    try {

        const vehicles =
            await vehicleService.getAllVehicles();

        return res.status(200).json({
            success: true,
            data: vehicles
        });

    } catch (error) {

        console.error(
            "Get Vehicles Error:",
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
// Update Vehicle
// ========================================

async function updateVehicle(req, res) {

    try {

        const { id } = req.params;

        const vehicle =
            await vehicleService.updateVehicle(
                id,
                req.body
            );

        return res.status(200).json({
            success: true,
            data: vehicle
        });

    } catch (error) {

        console.error(
            "Update Vehicle Error:",
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
// Delete Vehicle
// ========================================

async function deleteVehicle(req, res) {

    try {

        const { id } = req.params;

        const vehicle =
            await vehicleService.deleteVehicle(id);

        return res.status(200).json({
            success: true,
            data: vehicle
        });

    } catch (error) {

        console.error(
            "Delete Vehicle Error:",
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
    createVehicle,
    getVehicleById,
    getAllVehicles,
    updateVehicle,
    deleteVehicle
};