const personnelRepository =
    require("../repositories/personnelRepository");


// ========================================
// Create Personnel
// ========================================

async function createPersonnel(data) {

    if (
        !data.personnelNumber ||
        data.personnelNumber.trim() === ""
    ) {
        const error = new Error(
            "Personnel number is required"
        );

        error.statusCode = 400;
        throw error;
    }

    if (
        !data.name ||
        data.name.trim() === ""
    ) {
        const error = new Error(
            "Personnel name is required"
        );

        error.statusCode = 400;
        throw error;
    }

    return await personnelRepository.createPersonnel({
        personnelNumber:
            data.personnelNumber.trim(),

        name:
            data.name.trim(),

        status:
            data.status || "ACTIVE"
    });
}


// ========================================
// Get Personnel By ID
// ========================================

async function getPersonnelById(id) {

    const personnel =
        await personnelRepository.findPersonnelById(id);

    if (!personnel) {
        const error = new Error(
            "Personnel not found"
        );

        error.statusCode = 404;
        throw error;
    }

    return personnel;
}


// ========================================
// Get All Personnel
// ========================================

async function getAllPersonnel() {

    return await personnelRepository
        .findAllPersonnel();
}


// ========================================
// Update Personnel
// ========================================

async function updatePersonnel(id, data) {

    const existing =
        await personnelRepository.findPersonnelById(id);

    if (!existing) {
        const error = new Error(
            "Personnel not found"
        );

        error.statusCode = 404;
        throw error;
    }

    if (
        data.personnelNumber !== undefined &&
        data.personnelNumber.trim() === ""
    ) {
        const error = new Error(
            "Personnel number is required"
        );

        error.statusCode = 400;
        throw error;
    }

    if (
        data.name !== undefined &&
        data.name.trim() === ""
    ) {
        const error = new Error(
            "Personnel name is required"
        );

        error.statusCode = 400;
        throw error;
    }

    return await personnelRepository.updatePersonnel(
        id,
        {
            personnelNumber:
                data.personnelNumber !== undefined
                    ? data.personnelNumber.trim()
                    : undefined,

            name:
                data.name !== undefined
                    ? data.name.trim()
                    : undefined,

            status:
                data.status !== undefined
                    ? data.status
                    : undefined
        }
    );
}


// ========================================
// Delete Personnel
// ========================================

async function deletePersonnel(id) {

    const existing =
        await personnelRepository.findPersonnelById(id);

    if (!existing) {
        const error = new Error(
            "Personnel not found"
        );

        error.statusCode = 404;
        throw error;
    }

    return await personnelRepository
        .deletePersonnel(id);
}


module.exports = {
    createPersonnel,
    getPersonnelById,
    getAllPersonnel,
    updatePersonnel,
    deletePersonnel
};