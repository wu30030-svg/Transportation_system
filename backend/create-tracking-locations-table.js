const pool = require("./config/db");

async function main() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(`
            CREATE TABLE IF NOT EXISTS tracking_locations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                mission_run_id UUID NOT NULL,

                personnel_id UUID NOT NULL,

                latitude DOUBLE PRECISION NOT NULL,

                longitude DOUBLE PRECISION NOT NULL,

                accuracy DOUBLE PRECISION,

                recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                CONSTRAINT tracking_locations_mission_run_id_fkey
                    FOREIGN KEY (mission_run_id)
                    REFERENCES mission_runs(id)
                    ON DELETE CASCADE,

                CONSTRAINT tracking_locations_personnel_id_fkey
                    FOREIGN KEY (personnel_id)
                    REFERENCES personnel(id)
                    ON DELETE RESTRICT,

                CONSTRAINT tracking_locations_latitude_check
                    CHECK (
                        latitude >= -90
                        AND latitude <= 90
                    ),

                CONSTRAINT tracking_locations_longitude_check
                    CHECK (
                        longitude >= -180
                        AND longitude <= 180
                    ),

                CONSTRAINT tracking_locations_accuracy_check
                    CHECK (
                        accuracy IS NULL
                        OR accuracy >= 0
                    )
            );
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tracking_locations_run_personnel_time
            ON tracking_locations (
                mission_run_id,
                personnel_id,
                recorded_at DESC
            );
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tracking_locations_run_time
            ON tracking_locations (
                mission_run_id,
                recorded_at DESC
            );
        `);

        await client.query("COMMIT");

        console.log("Tracking table migration completed.");

    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

main();
