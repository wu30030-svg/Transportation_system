async function selectMission(missionId) {

    try {

        const response = await getMission(missionId);

        currentMission = response.data;

        await loadMissionAssignments(missionId);

        renderMission();

        renderMissionVehicles();

        refreshMissionListActiveState();

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

    setText("mission-description", mission.description || "無任務說明");

    setText("mission-purpose", mission.purpose || "未指定");

    setText("mission-id", mission.id);

    setText("mission-vehicle-count", String(currentAssignments.length).padStart(2, "0"));

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
