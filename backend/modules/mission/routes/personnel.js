const express = require("express");

const router = express.Router();

const personnelController =
    require("../controllers/personnelController");


// ========================================
// Personnel
// ========================================

// 建立 Personnel
router.post(
    "/",
    personnelController.createPersonnel
);


// 取得 Personnel 列表
router.get(
    "/",
    personnelController.getAllPersonnel
);

// 綁定 Personnel 對應的 User
router.post(
    "/:id/user",
    personnelController.bindPersonnelUser
);

// 取得單一 Personnel
router.get(
    "/:id",
    personnelController.getPersonnelById
);


// 更新 Personnel
router.patch(
    "/:id",
    personnelController.updatePersonnel
);


// 刪除 Personnel
router.delete(
    "/:id",
    personnelController.deletePersonnel
);


module.exports = router;