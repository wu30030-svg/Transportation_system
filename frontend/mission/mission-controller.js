let currentMission = null;
let currentMissionRun = null;
let currentAssignments = [];

const missionStatusText = {

    DRAFT: "草稿",
    PLANNED: "已規劃",
    READY: "待執行",
    RUNNING: "執行中",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
    ABORTED: "已中止"

};

function getMissionStatusText(status) {

    return missionStatusText[status] || status || "未知";

}

function formatMissionDate(value) {

    if (!value) {
        return "--------";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "--------";
    }

    return date.toLocaleString("zh-TW", {

        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"

    });

}

function shortMissionId(id) {

    if (!id) {
        return "--------";
    }

    return id.substring(0, 8).toUpperCase();

}

function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {

        element.textContent = value ?? "-";

    }

}

document.addEventListener("DOMContentLoaded", async () => {

    // ========================================
    // Authentication Gate
    // ========================================

    if (
        typeof isAuthenticated !== "function" ||
        !isAuthenticated()
    ) {

        console.log(
            "[Mission Center] 尚未登入，暫停 Mission Center 初始化。"
        );

        return;

    }


    console.log(
        "[Mission Center] 已登入，初始化 Mission Center。"
    );


    setupWorkspaceTabs();

    await loadMissions();

});
document.getElementById("refreshMissionsBtn")?.addEventListener("click", loadMissions);
