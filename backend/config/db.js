const { Pool } = require("pg");

const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "Wu30030@30030",
    database: "transportation_system"
});

module.exports = pool;