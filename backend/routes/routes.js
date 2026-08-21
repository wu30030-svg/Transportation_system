const express = require("express");
const router = express.Router();

const {
    getRouteCameras
} = require("../controllers/routesController");

router.post("/cameras", getRouteCameras);

module.exports = router;