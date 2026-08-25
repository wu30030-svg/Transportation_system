const { Pool } = require("pg");

const usingDatabaseUrl = Boolean(process.env.DATABASE_URL);

console.log(
    "Database connection mode:",
    usingDatabaseUrl ? "DATABASE_URL" : "LOCAL_DB_CONFIG"
);

const poolConfig = usingDatabaseUrl
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };

const pool = new Pool(poolConfig);

module.exports = pool;