const pool = require("../../../config/db");


// 建立 Mission Template
async function createTemplate({
    templateName,
    description,
    purpose,
    createdBy
}) {
    const query = `
        INSERT INTO mission_templates (
            template_name,
            description,
            purpose,
            created_by
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;

    const values = [
        templateName,
        description || null,
        purpose || null,
        createdBy || null
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
}


// 取得單一 Mission Template
async function findTemplateById(id) {
    const query = `
        SELECT *
        FROM mission_templates
        WHERE id = $1;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
}


// 取得所有 Mission Templates
async function findAllTemplates() {
    const query = `
        SELECT *
        FROM mission_templates
        ORDER BY created_at DESC;
    `;

    const result = await pool.query(query);

    return result.rows;
}


// 更新 Mission Template
async function updateTemplate(
    id,
    {
        templateName,
        description,
        purpose
    }
) {
    const query = `
        UPDATE mission_templates
        SET
            template_name = $1,
            description = $2,
            purpose = $3,
            updated_at = NOW()
        WHERE id = $4
        RETURNING *;
    `;

    const values = [
        templateName,
        description || null,
        purpose || null,
        id
    ];

    const result = await pool.query(query, values);

    return result.rows[0] || null;
}

async function deleteTemplate(id) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(
            `
            DELETE FROM mission_template_routes
            WHERE template_id = $1;
            `,
            [id]
        );

        const result = await client.query(
            `
            DELETE FROM mission_templates
            WHERE id = $1
            RETURNING *;
            `,
            [id]
        );

        await client.query("COMMIT");

        return result.rows[0] || null;

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}


module.exports = {
    createTemplate,
    findTemplateById,
    findAllTemplates,
    updateTemplate,
    deleteTemplate
};