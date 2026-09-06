require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const db = require("./config/db");

db.query(`
    CREATE TABLE IF NOT EXISTS mission_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        mission_id UUID NOT NULL,

        status VARCHAR NOT NULL DEFAULT 'RUNNING',

        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        completed_at TIMESTAMPTZ,

        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT mission_runs_mission_id_fkey
            FOREIGN KEY (mission_id)
            REFERENCES missions(id),

        CONSTRAINT mission_runs_status_check
            CHECK (
                status IN (
                    'RUNNING',
                    'COMPLETED',
                    'ABORTED'
                )
            )
    )
`)
.then(() => {
    console.log("mission_runs table created successfully");
    process.exit(0);
})
.catch(e => {
    console.error(e);
    process.exit(1);
});
