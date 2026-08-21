const pool = require("../../../config/db");


// ========================================
// Create Personnel
// ========================================

async function createPersonnel({
    personnelNumber,
    name,
    status
}) {
    const query = `
        INSERT INTO personnel (
            personnel_number,
            name,
            status
        )
        VALUES ($1, $2, $3)
        RETURNING *;
    `;

    const values = [
        personnelNumber,
        name,
        status || "ACTIVE"
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
}


// ========================================
// Find Personnel By ID
// ========================================

async function findPersonnelById(id) {
    const query = `
        SELECT *
        FROM personnel
        WHERE id = $1;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
}


// ========================================
// Find All Personnel
// ========================================

async function findAllPersonnel() {
    const query = `
        SELECT *
        FROM personnel
        ORDER BY created_at DESC;
    `;

    const result = await pool.query(query);

    return result.rows;
}


// ========================================
// Update Personnel
// ========================================

async function updatePersonnel(
    id,
    {
        personnelNumber,
        name,
        status
    }
) {
    const query = `
        UPDATE personnel
        SET
            personnel_number = COALESCE($1, personnel_number),
            name = COALESCE($2, name),
            status = COALESCE($3, status),
            updated_at = NOW()
        WHERE id = $4
        RETURNING *;
    `;

    const values = [
        personnelNumber,
        name,
        status,
        id
    ];

    const result = await pool.query(query, values);

    return result.rows[0] || null;
}


// ========================================
// Delete Personnel
// ========================================

async function deletePersonnel(id) {
    const query = `
        DELETE FROM personnel
        WHERE id = $1
        RETURNING *;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
}


module.exports = {
    createPersonnel,
    findPersonnelById,
    findAllPersonnel,
    updatePersonnel,
    deletePersonnel
};