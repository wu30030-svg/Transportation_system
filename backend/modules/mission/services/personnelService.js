const personnelRepository =
    require("../repositories/personnelRepository");

const authRepository =
    require("../../auth/repositories/authRepository");


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
// Bind Personnel To User
// ========================================

async function bindPersonnelUser(
    personnelId,
    userId
) {

    // 1. 驗證 Personnel ID
    if (!personnelId) {
        const error = new Error(
            "Personnel ID is required"
        );

        error.statusCode = 400;
        throw error;
    }

    // 2. 驗證 User ID
    if (!userId) {
        const error = new Error(
            "User ID is required"
        );

        error.statusCode = 400;
        throw error;
    }

    // 3. 確認 Personnel 存在
    const personnel =
        await personnelRepository.findPersonnelById(
            personnelId
        );

    if (!personnel) {
        const error = new Error(
            "Personnel not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // 4. Personnel 已經綁定 User
    if (personnel.user_id) {
        const error = new Error(
            "Personnel is already bound to a User"
        );

        error.statusCode = 409;
        throw error;
    }

    // 5. 確認 User 存在
    const user =
        await authRepository.findUserById(userId);

    if (!user) {
        const error = new Error(
            "User not found"
        );

        error.statusCode = 404;
        throw error;
    }

    // 6. 確認 User 尚未被其他 Personnel 綁定
    const allPersonnel =
        await personnelRepository.findAllPersonnel();

    const existingBinding =
        allPersonnel.find(
            item =>
                item.user_id === userId &&
                item.id !== personnelId
        );

    if (existingBinding) {
        const error = new Error(
            "User is already bound to another Personnel"
        );

        error.statusCode = 409;
        throw error;
    }

    // 7. 執行綁定
    return await personnelRepository.bindPersonnelUser(
        personnelId,
        userId
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
    bindPersonnelUser,
    deletePersonnel
};
