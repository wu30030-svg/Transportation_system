const vehicleRepository =
    require("../repositories/vehicleRepository");


// ========================================
// Create Vehicle
// ========================================

async function createVehicle(data) {

    if (
        !data.vehicleNumber ||
        data.vehicleNumber.trim() === ""
    ) {
        throw new Error("Vehicle number is required");
    }

    if (
        !data.vehicleType ||
        data.vehicleType.trim() === ""
    ) {
        throw new Error("Vehicle type is required");
    }

    return await vehicleRepository.createVehicle({
        vehicleNumber: data.vehicleNumber.trim(),
        vehicleType: data.vehicleType.trim(),

        vehicleHeight: data.vehicleHeight,
        vehicleWidth: data.vehicleWidth,
        vehicleWeight: data.vehicleWeight,
        vehicleLoadType: data.vehicleLoadType,

        status: data.status
    });
}


// ========================================
// Get Vehicle By ID
// ========================================

async function getVehicleById(id) {

    const vehicle =
        await vehicleRepository.findVehicleById(id);

    if (!vehicle) {
        const error = new Error("Vehicle not found");
        error.statusCode = 404;
        throw error;
    }

    return vehicle;
}


// ========================================
// Get All Vehicles
// ========================================

async function getAllVehicles() {

    return await vehicleRepository.findAllVehicles();
}


// ========================================
// Update Vehicle
// ========================================

async function updateVehicle(id, data) {

    const existing =
        await vehicleRepository.findVehicleById(id);

    if (!existing) {
        const error = new Error("Vehicle not found");
        error.statusCode = 404;
        throw error;
    }

    if (
        data.vehicleNumber !== undefined &&
        data.vehicleNumber.trim() === ""
    ) {
        const error =
            new Error("Vehicle number is required");

        error.statusCode = 400;

        throw error;
    }

    if (
        data.vehicleType !== undefined &&
        data.vehicleType.trim() === ""
    ) {
        const error =
            new Error("Vehicle type is required");

        error.statusCode = 400;

        throw error;
    }

    return await vehicleRepository.updateVehicle(
        id,
        {
            vehicleNumber:
                data.vehicleNumber !== undefined
                    ? data.vehicleNumber.trim()
                    : existing.vehicle_number,

            vehicleType:
                data.vehicleType !== undefined
                    ? data.vehicleType.trim()
                    : existing.vehicle_type,

            vehicleHeight:
                data.vehicleHeight !== undefined
                    ? data.vehicleHeight
                    : existing.vehicle_height,

            vehicleWidth:
                data.vehicleWidth !== undefined
                    ? data.vehicleWidth
                    : existing.vehicle_width,

            vehicleWeight:
                data.vehicleWeight !== undefined
                    ? data.vehicleWeight
                    : existing.vehicle_weight,

            vehicleLoadType:
                data.vehicleLoadType !== undefined
                    ? data.vehicleLoadType
                    : existing.vehicle_load_type,

            status:
                data.status !== undefined
                    ? data.status
                    : existing.status
        }
    );
}


// ========================================
// Delete Vehicle
// ========================================

async function deleteVehicle(id) {

    const existing =
        await vehicleRepository.findVehicleById(id);

    if (!existing) {
        const error = new Error("Vehicle not found");
        error.statusCode = 404;
        throw error;
    }

    return await vehicleRepository.deleteVehicle(id);
}


module.exports = {
    createVehicle,
    getVehicleById,
    getAllVehicles,
    updateVehicle,
    deleteVehicle
};