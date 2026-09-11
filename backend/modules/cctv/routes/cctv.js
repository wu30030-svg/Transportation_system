const express = require("express");

const router =
    express.Router();

const {
    getCctvSourceController,
    streamCctvController,
    snapshotCctvController
} = require("../controllers/cctvController");


// ========================================
// CCTV Source
// ========================================

router.get(
    "/source/:cameraId",
    getCctvSourceController
);


// ========================================
// CCTV MJPEG Stream
// ========================================

router.get(
    "/stream/:cameraId",
    streamCctvController
);


// ========================================
// CCTV JPEG Snapshot
// ========================================

router.get(
    "/snapshot/:cameraId",
    snapshotCctvController
);


module.exports = router;