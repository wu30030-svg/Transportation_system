const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

async function importCameras() {

    try {

        const filePath = path.join(__dirname, "../data/cam-list.json");

        const cameras = JSON.parse(fs.readFileSync(filePath, "utf8"));

        console.log(`共讀取 ${cameras.length} 筆 CCTV`);

        for (const cam of cameras) {

            await pool.query(
                `
                INSERT INTO cameras
                (camera_id, camera_name, latitude, longitude, camera_url)

                VALUES ($1,$2,$3,$4,$5)

                ON CONFLICT (camera_id)
                DO NOTHING;
                `,
                [
                    cam.id,
                    cam.name,
                    cam.lat,
                    cam.lon,
                    cam.cam_url
                ]
            );

        }

        console.log("CCTV 匯入完成！");

    } catch (err) {

        console.error(err);

    } finally {

        await pool.end();

    }

}

importCameras();