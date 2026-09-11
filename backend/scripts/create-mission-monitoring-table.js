const pool = require("../config/db");

async function createMissionMonitoringTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.mission_monitoring (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                mission_id uuid NOT NULL,
                camera_id character varying(100) NOT NULL,
                display_order integer NOT NULL,
                is_pinned boolean DEFAULT false NOT NULL,
                created_at timestamp with time zone DEFAULT now() NOT NULL,
                updated_at timestamp with time zone DEFAULT now() NOT NULL,

                CONSTRAINT mission_monitoring_pkey
                    PRIMARY KEY (id),

                CONSTRAINT mission_monitoring_mission_id_fkey
                    FOREIGN KEY (mission_id)
                    REFERENCES public.missions(id)
                    ON DELETE RESTRICT,

                CONSTRAINT mission_monitoring_camera_id_fkey
                    FOREIGN KEY (camera_id)
                    REFERENCES public.cameras(camera_id)
                    ON DELETE RESTRICT,

                CONSTRAINT mission_monitoring_display_order_check
                    CHECK (display_order >= 1),

                CONSTRAINT mission_monitoring_mission_camera_unique
                    UNIQUE (mission_id, camera_id)
            );
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_mission_monitoring_mission_id
            ON public.mission_monitoring (mission_id);
        `);

        console.log("mission_monitoring table created successfully.");

    } catch (err) {
        console.error("Failed to create mission_monitoring table:");
        console.error(err);

    } finally {
        await pool.end();
    }
}

createMissionMonitoringTable();