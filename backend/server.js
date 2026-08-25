require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api", require("./routes"));

console.log("DATABASE_URL exists:", Boolean(process.env.DATABASE_URL));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});