async function selectMission(missionId) {

    try {

        const response = await getMission(missionId);

        // ========================================
        // 切換 Mission 前，先清除上一個 Mission 的 Route
        // ========================================

        if (typeof clearMissionRouteState === "function") {
            clearMissionRouteState();
        }

        // ========================================
        // 載入新的 Mission
        // ========================================

        currentMission = response.data;

        await loadCurrentMissionRun(missionId);

        await loadMissionAssignments(missionId);

        let missionRoute = null;

        try {
            const routeResponse = await getMissionRoute(missionId);
            missionRoute = routeResponse?.data || null;
        } catch (error) {
            if (!error.message.includes("not found")) {
                console.warn("[Mission Route] 載入路線狀態失敗:", error);
            }
        }

        currentMission.route = missionRoute;

        renderMission();

        renderMissionVehicles();

        refreshMissionListActiveState();

        // ========================================
        // 如果目前正在 Route Workspace
        // 重新載入新 Mission 的保存路線
        // ========================================

        const activeWorkspace =
            document.querySelector(".workspace-tab.active");

        if (
            activeWorkspace &&
            activeWorkspace.dataset.workspace === "route" &&
            typeof loadMissionRoute === "function"
        ) {
            await loadMissionRoute();
        }

    } catch (error) {

        console.error(
            "Mission Select Error:",
            error
        );

        alert(
            "無法載入任務資料：" +
            error.message
        );

    }

}

async function loadMissionAssignments(missionId) {

    try {

        const response = await getMissionVehicleAssignments(missionId);

        currentAssignments = response.data || [];

    } catch (error) {

        console.warn("Mission Assignment Load Error:", error);

        currentAssignments = [];

    }

}

function renderMission() {

    if (!currentMission) {
        return;
    }

    // ========================================
    // Update Workspace
    // ========================================

    updateExecutionReportTab(currentMission.status);

    document.getElementById("mission-empty-state").classList.add("hidden");

    document.getElementById("mission-overview-content").classList.remove("hidden");

    const mission = currentMission;

    const status = getMissionStatusText(mission.status);

    setText("workspace-title", "任務總覽");

    setText("selected-mission-code", shortMissionId(mission.id));

    setText("mission-name", mission.mission_name || "未命名任務");

    setText("mission-status-badge", status);

    const badge = document.getElementById("mission-status-badge");

    badge.className = "status-badge " + mission.status.toLowerCase();

    const editMissionBtn =
        document.getElementById("editMissionBtn");

    const startExecutionBtn =
        document.getElementById("startExecutionBtn");

    if (startExecutionBtn) {

        const canStartExecution =
            mission.status === "READY";

        startExecutionBtn.style.display =
            canStartExecution
                ? "inline-block"
                : "none";
    }

    if (editMissionBtn) {

        const canEdit =
            mission.status === "DRAFT";

        editMissionBtn.disabled =
            !canEdit;

        editMissionBtn.title =
            canEdit
                ? "編輯任務"
                : "只有草稿任務可以編輯";
    }

    setText("mission-description", mission.description || "無任務說明");

    setText("mission-purpose", mission.purpose || "未指定");

    setText("mission-id", mission.id);

    setText("mission-vehicle-count", String(currentAssignments.length).padStart(2, "0"));

    const routeStatus =
        mission.route?.confirmed === true
            ? "已確認"
            : "尚未規劃";

    setText("mission-route-status", routeStatus);
    setText("context-route-status", routeStatus);

    setText("mission-start-time", formatMissionDate(mission.start_time));

    setText("context-status", status);

    setText("context-mission-id", mission.id);

    setText("context-vehicle-count", String(currentAssignments.length).padStart(2, "0"));

    updateLifecycle(mission.status);

}

function updateLifecycle(status) {

    const order = [
        "DRAFT",
        "PLANNED",
        "READY",
        "RUNNING",
        "COMPLETED"
    ];

    const currentIndex = order.indexOf(status);

    document.querySelectorAll(".lifecycle-step").forEach(step => {

        const stepStatus = step.dataset.status;

        const stepIndex = order.indexOf(stepStatus);

        step.classList.remove("completed", "active");

        if (currentIndex >= 0 && stepIndex < currentIndex) {

            step.classList.add("completed");

        }

        if (stepStatus === status) {

            step.classList.add("active");

        }

    });

}

async function loadCurrentMissionRun(missionId) {

    // ========================================
    // 非執行中任務，不需要 Mission Run
    // ========================================

    if (
        !currentMission ||
        currentMission.status !== "RUNNING"
    ) {

        currentMissionRun = null;

        return;

    }


    try {

        const response =
            await getMissionRuns(missionId);

        const missionRuns =
            response?.data || [];


        // ========================================
        // 找目前正在執行中的 Mission Run
        // ========================================

        currentMissionRun =
            missionRuns.find(
                run =>
                    run.status === "RUNNING"
            ) || null;


        if (currentMissionRun) {

            console.log(
                "[Mission Run] 已恢復目前執行中的 Mission Run:",
                currentMissionRun.id
            );

        } else {

            console.warn(
                "[Mission Run] Mission 為 RUNNING，但找不到 RUNNING Mission Run。"
            );

        }

    } catch (error) {

        console.error(
            "[Mission Run] 載入目前執行紀錄失敗:",
            error
        );

        currentMissionRun = null;

    }

}