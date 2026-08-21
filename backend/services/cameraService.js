const fs = require("fs").promises;
const path = require("path");

async function loadCameraData() {

    const filePath = path.join(
        __dirname,
        "..",
        "data",
        "cam-list.json"
    );

    const data = await fs.readFile(filePath, "utf8");

    return JSON.parse(data);

}

module.exports = {
    loadCameraData
};