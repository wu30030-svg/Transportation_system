const express = require("express");
const router = express.Router();

const {
    getAllCameras,
    getViewportCameras
} = require("../controllers/camerasController");

router.get("/", getAllCameras);

router.get("/viewport", getViewportCameras);

module.exports = router;