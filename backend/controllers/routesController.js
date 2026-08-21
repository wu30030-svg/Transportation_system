const {

    getRouteCameras

} = require("../services/routeService");

async function routeController(req, res) {

    try {

        const { decodedPath } = req.body;

        if (!Array.isArray(decodedPath) || decodedPath.length === 0) {

            return res.status(400).json({

                success: false,

                message: "decodedPath 格式錯誤"

            });

        }

        const result = await getRouteCameras(decodedPath);

        console.log("========== Route API ==========");

        console.log(`收到 ${decodedPath.length} 個路徑點`);

        console.log("第一個點：", decodedPath[0]);

        console.log("最後一個點：", decodedPath[decodedPath.length - 1]);

        console.log("===============================");

        res.json({

            success: true,

            points: decodedPath.length,

            bbox: result.bbox,

            cameras: result.cameras

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

}

module.exports = {

    getRouteCameras: routeController

};