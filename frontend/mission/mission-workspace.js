// ========================================
// Mission Workspace
// ========================================
//
// 負責：
// 1. Execution / Report Tab 二選一
// 2. 根據 Mission Status 決定顯示哪一個
// 3. 確保目前 Workspace 不會停留在無效的 Tab
//
// 不負責：
// - API
// - Mission 資料載入
// - 各 Workspace 內容
// ========================================


// ========================================
// Update Execution / Report Tab
// ========================================

function updateExecutionReportTab(status) {

    const executionTab =
        document.getElementById("execution-tab");

    const reportTab =
        document.getElementById("report-tab");


    if (!executionTab || !reportTab) {

        console.warn(
            "Mission Workspace: Execution / Report tab not found."
        );

        return;
    }


    // ========================================
    // Mission Completed
    // ========================================

    if (status === "COMPLETED") {

        executionTab.classList.add("hidden");

        reportTab.classList.remove("hidden");


        // ------------------------------------
        // 如果目前正在看 Execution
        // 自動切換到 Report
        // ------------------------------------

        const activeTab =
            document.querySelector(".workspace-tab.active");

        if (
            activeTab &&
            activeTab.dataset.workspace === "execution"
        ) {

            switchWorkspace("report");

        }

        return;
    }


    // ========================================
    // Mission Not Completed
    // ========================================

    executionTab.classList.remove("hidden");

    reportTab.classList.add("hidden");

}


// ========================================
// Switch Workspace
// ========================================

async function switchWorkspace(workspace) {

    // ========================================
    // Leave Execution Workspace
    // ========================================

    const activeTab =
        document.querySelector(".workspace-tab.active");

    if (
        activeTab &&
        activeTab.dataset.workspace === "execution" &&
        workspace !== "execution" &&
        typeof stopExecutionMonitoring === "function"
    ) {

        stopExecutionMonitoring();

    }

    // ========================================
    // Mission Lifecycle Workspace Guard
    // ========================================

    if (currentMission) {

        const status =
            currentMission.status;

        // RUNNING：
        // 只能進入 Execution
        if (
            status === "RUNNING" &&
            workspace !== "execution"
        ) {

            console.warn(
                "[Mission Workspace] RUNNING 狀態只能進入執行工作區。"
            );

            return;
        }


        // COMPLETED：
        // 只能進入 Report
        if (
            status === "COMPLETED" &&
            workspace !== "report"
        ) {

            console.warn(
                "[Mission Workspace] COMPLETED 狀態只能進入報告工作區。"
            );

            return;
        }


        // ABORTED：
        // 目前仍保留 Execution 作為執行結果查看區
        if (
            status === "ABORTED" &&
            workspace !== "execution"
        ) {

            console.warn(
                "[Mission Workspace] ABORTED 狀態只能進入執行工作區。"
            );

            return;
        }

    }

    const tabs =
        document.querySelectorAll(".workspace-tab");

    const panels =
        document.querySelectorAll(".workspace-panel");


    // ========================================
    // 找到目標 Tab
    // ========================================

    const targetTab =
        document.querySelector(
            `.workspace-tab[data-workspace="${workspace}"]`
        );


    const targetPanel =
        document.getElementById(
            `workspace-${workspace}`
        );


    if (!targetTab || !targetPanel) {

        console.warn(
            "Mission Workspace: Workspace not found:",
            workspace
        );

        return;
    }


    // ========================================
    // 確認 Tab 沒有被隱藏
    // ========================================

    if (targetTab.classList.contains("hidden")) {

        console.warn(
            "Mission Workspace: Workspace tab is hidden:",
            workspace
        );

        return;
    }


    // ========================================
    // 清除 Active
    // ========================================

    tabs.forEach(tab => {

        tab.classList.remove("active");

    });


    panels.forEach(panel => {

        panel.classList.remove("active");

    });


    // ========================================
    // 啟用 Workspace
    // ========================================

    targetTab.classList.add("active");

    targetPanel.classList.add("active");


    // ========================================
    // Route Workspace
    // ========================================

    if (
        workspace === "route" &&
        typeof initMap === "function"
    ) {

        await initMap();

        if (typeof loadMissionRoute === "function") {

            await loadMissionRoute();

        }

    }

    // ========================================
    // Execution Workspace
    // ========================================

    if (
        workspace === "execution" &&
        typeof initExecutionMap === "function"
    ) {

        await initExecutionMap();


        // ========================================
        // Load Mission Monitoring
        // ========================================

        if (
            typeof loadMissionMonitoring === "function"
        ) {

            await loadMissionMonitoring();

        }

    }

    // ========================================
    // Monitoring Workspace
    // ========================================

    if (
        workspace === "monitoring" &&
        typeof loadMissionMonitoring === "function"
    ) {

        await loadMissionMonitoring();

    }

}



// ========================================
// Planning Confirmation
// ========================================

async function showPlanningConfirmation() {

    // ========================================
    // Mission Status Guard
    // ========================================

    if (!currentMission) {

        console.warn(
            "[Mission Workspace] No mission selected."
        );

        return;
    }


    // ========================================
    // 只有 PLANNED 才能進入完成規劃
    // ========================================

    if (currentMission.status !== "PLANNED") {

        console.warn(
            "[Mission Workspace] Planning confirmation blocked:",
            currentMission.status
        );

        // 如果已經不是 PLANNED
        // 直接回到 01 總覽
        await switchWorkspace("overview");

        return;
    }


    const tabs =
        document.querySelectorAll(".workspace-tab");

    const panels =
        document.querySelectorAll(".workspace-panel");

    const workspaceTabs =
        document.querySelector(".workspace-tabs");

    const confirmationPanel =
        document.getElementById(
            "workspace-planning-confirm"
        );

    if (!confirmationPanel) {

        console.warn(
            "Mission Workspace: Planning confirmation panel not found."
        );

        return;
    }


    // Hide workspace navigation
    if (workspaceTabs) {
        workspaceTabs.classList.add("hidden");
    }


    // Clear active state
    tabs.forEach(tab => {
        tab.classList.remove("active");
    });


    panels.forEach(panel => {
        panel.classList.remove("active");
    });


    // Show planning confirmation
    confirmationPanel.classList.add("active");


    console.log(
        "[Mission Workspace] Planning confirmation opened."
    );


    // Load latest planning data
    await loadPlanningConfirmation();
}

// ========================================
// Planning Confirmation Summary
// ========================================

async function loadPlanningConfirmation() {

    if (!currentMission) {
        console.warn(
            "[Planning Confirmation] No mission selected."
        );
        return;
    }

    const content =
        document.getElementById(
            "planning-confirm-content"
        );

    if (!content) {
        console.warn(
            "[Planning Confirmation] Content container not found."
        );
        return;
    }

    content.innerHTML = `
        <div class="planning-confirm-loading">
            正在載入規劃資料...
        </div>
    `;

    try {

        // ========================================
        // Load Route
        // ========================================

        let route = null;

        try {

            const routeResponse =
                await getMissionRoute(
                    currentMission.id
                );

            route = routeResponse?.data || null;

        } catch (error) {

            console.warn(
                "[Planning Confirmation] Route load failed:",
                error
            );

        }


        // ========================================
        // Load Monitoring
        // ========================================

        let monitorings = [];

        try {

            const monitoringResponse =
                await getMissionMonitorings(
                    currentMission.id
                );

            monitorings =
                monitoringResponse?.data || [];

        } catch (error) {

            console.warn(
                "[Planning Confirmation] Monitoring load failed:",
                error
            );

        }


        // ========================================
        // Vehicle Assignments
        // ========================================

        const assignments =
            Array.isArray(currentAssignments)
                ? currentAssignments
                : [];


        renderPlanningConfirmation({
            mission: currentMission,
            assignments,
            route,
            monitorings
        });

    } catch (error) {

        console.error(
            "[Planning Confirmation] Load failed:",
            error
        );

        content.innerHTML = `
            <div class="planning-confirm-error">
                <h3>無法載入規劃資料</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}


// ========================================
// Render Planning Confirmation
// ========================================

function renderPlanningConfirmation({
    mission,
    assignments,
    route,
    monitorings
}) {

    const content =
        document.getElementById(
            "planning-confirm-content"
        );

    if (!content) return;


    // ========================================
    // Main Vehicle
    // ========================================

    const mainVehicle =
        assignments.find(
            assignment =>
                assignment.is_main_vehicle === true
        );


    // ========================================
    // Vehicle Summary
    // ========================================

    const vehicleRows =
        assignments.length > 0
            ? assignments.map((assignment, index) => {

                const vehicle =
                    assignment.vehicle || {};

                const driver =
                    assignment.driver || null;

                const commander =
                    assignment.commander || null;

                const mainText =
                    assignment.is_main_vehicle === true
                        ? "主車"
                        : "";

                return `
                    <div class="planning-confirm-row">

                        <div class="planning-confirm-index">
                            ${String(index + 1).padStart(2, "0")}
                        </div>

                        <div>
                            <span class="planning-confirm-label">
                                車輛
                            </span>

                            <strong>
                                ${vehicle.vehicle_number || "未設定"}
                            </strong>

                            <small>
                                ${vehicle.vehicle_type || "未指定"}
                            </small>
                        </div>

                        <div>
                            <span class="planning-confirm-label">
                                駕駛
                            </span>

                            <strong>
                                ${driver?.name || "未配置"}
                            </strong>

                            <small>
                                ${driver?.personnel_number || ""}
                            </small>
                        </div>

                        <div>
                            <span class="planning-confirm-label">
                                車長
                            </span>

                            <strong>
                                ${commander?.name || "未配置"}
                            </strong>

                            <small>
                                ${commander?.personnel_number || ""}
                            </small>
                        </div>

                        <div>
                            <span class="planning-confirm-label">
                                編組
                            </span>

                            <strong>
                                ${mainText}
                            </strong>
                        </div>

                    </div>
                `;
            }).join("")
            : `
                <div class="planning-confirm-empty">
                    尚未配置任務車輛
                </div>
            `;


    // ========================================
    // Monitoring Summary
    // ========================================

    const monitoringRows =
        monitorings.length > 0
            ? monitorings.map(monitoring => {

                return `
                    <div class="planning-confirm-row">

                        <div class="planning-confirm-index">
                            ${String(
                    monitoring.display_order
                ).padStart(2, "0")}
                        </div>

                        <div>
                            <span class="planning-confirm-label">
                                顯示順序
                            </span>

                            <strong>
                                ${monitoring.display_order}
                            </strong>
                        </div>

                        <div>
                            <span class="planning-confirm-label">
                                CCTV
                            </span>

                            <strong>
                                ${monitoring.camera_name || "未命名 CCTV"}
                            </strong>

                            <small>
                                ${monitoring.camera_id || ""}
                            </small>
                        </div>

                        <div>
                            <span class="planning-confirm-label">
                                狀態
                            </span>

                            <strong>
                                ${monitoring.is_pinned
                        ? "已釘選"
                        : "未釘選"
                    }
                            </strong>
                        </div>

                    </div>
                `;
            }).join("")
            : `
                <div class="planning-confirm-empty">
                    尚未配置監控
                </div>
            `;


    // ========================================
    // Route Status
    // ========================================

    let routeStatus = "尚未規劃";

    if (route) {

        routeStatus =
            route.confirmed === true
                ? "已確認"
                : "已規劃，尚未確認";
    }


    // ========================================
    // Render
    // ========================================

    content.innerHTML = `

        <!-- ==================================
             01 任務基本資料
        =================================== -->

        <section class="planning-confirm-section card">

            <div class="card-header">

                <div>
                    <span class="eyebrow">
                        01　任務基本資料
                    </span>

                    <h3>
                        任務資訊
                    </h3>
                </div>

            </div>


            <div class="planning-confirm-info-grid">

                <div class="info-block">

                    <span class="info-label">
                        任務名稱
                    </span>

                    <strong>
                        ${mission.mission_name || "未設定"}
                    </strong>

                </div>


                <div class="info-block">

                    <span class="info-label">
                        任務開始時間
                    </span>

                    <strong>
                        ${typeof formatMissionDate === "function"
            ? formatMissionDate(mission.start_time)
            : (mission.start_time || "未設定")
        }
                    </strong>

                </div>


                <div class="info-block">

                    <span class="info-label">
                        任務說明
                    </span>

                    <div>
                        ${mission.description || "無"}
                    </div>

                </div>


                <div class="info-block">

                    <span class="info-label">
                        任務目的
                    </span>

                    <div>
                        ${mission.purpose || "未指定"}
                    </div>

                </div>

            </div>

        </section>


        <!-- ==================================
             02 車輛配置
        =================================== -->

        <section class="planning-confirm-section card">

            <div class="card-header">

                <div>
                    <span class="eyebrow">
                        02　車輛配置
                    </span>

                    <h3>
                        任務車輛
                    </h3>
                </div>

                <div class="planning-confirm-count mono">
                    ${String(assignments.length).padStart(2, "0")} 台
                </div>

            </div>


            <div class="planning-confirm-main-vehicle">

                <span class="info-label">
                    主車
                </span>

                <strong>
                    ${mainVehicle?.vehicle?.vehicle_number
        || "未設定"
        }
                </strong>

            </div>


            <div class="planning-confirm-list">

                ${vehicleRows}

            </div>

        </section>


        <!-- ==================================
             03 路線
        =================================== -->

        <section class="planning-confirm-section card">

            <div class="card-header">

                <div>
                    <span class="eyebrow">
                        03　路線
                    </span>

                    <h3>
                        任務路線
                    </h3>
                </div>

            </div>


            <div class="planning-confirm-info-grid">

                <div class="info-block">

                    <span class="info-label">
                        起點
                    </span>

                    <strong>
                        ${route?.start_name || "尚未設定"}
                    </strong>

                </div>


                <div class="info-block">

                    <span class="info-label">
                        終點
                    </span>

                    <strong>
                        ${route?.end_name || "尚未設定"}
                    </strong>

                </div>


                <div class="info-block">

                    <span class="info-label">
                        路線狀態
                    </span>

                    <strong>
                        ${routeStatus}
                    </strong>

                </div>

            </div>

        </section>


        <!-- ==================================
             04 監控
        =================================== -->

        <section class="planning-confirm-section card">

            <div class="card-header">

                <div>
                    <span class="eyebrow">
                        04　監控
                    </span>

                    <h3>
                        任務監控
                    </h3>
                </div>

                <div class="planning-confirm-count mono">
                    ${String(monitorings.length).padStart(2, "0")} 支
                </div>

            </div>


            <div class="planning-confirm-list">

                ${monitoringRows}

            </div>

        </section>

    `;
}
// ========================================
// Planning Confirmation - Back
// ========================================

document.addEventListener("click", (event) => {

    const button =
        event.target.closest("#planning-confirm-back-btn");

    if (!button) return;

    // 顯示規劃 Workspace
    const workspaceTabs =
        document.querySelector(".workspace-tabs");

    if (workspaceTabs) {
        workspaceTabs.classList.remove("hidden");
    }

    // 回到任務總覽
    switchWorkspace("overview");

    console.log(
        "[Mission Workspace] Back to planning workspace."
    );
});

// ========================================
// Planning Confirmation - Submit
// ========================================

document.addEventListener("click", async (event) => {

    const button =
        event.target.closest("#planning-confirm-submit-btn");

    if (!button) return;

    if (!currentMission) {

        alert("目前沒有選擇任務。");

        return;
    }

    if (currentMission.status !== "PLANNED") {

        alert("目前任務狀態不是已規劃。");

        return;
    }

    try {

        button.disabled = true;

        button.textContent = "確認中...";

        const response =
            await updateMissionStatus(
                currentMission.id,
                "READY"
            );

        console.log(
            "[Mission] 規劃確認成功:",
            response
        );

        // 重新載入目前 Mission
        await selectMission(
            currentMission.id
        );

        // 更新左側 Mission List
        await loadMissions();

        refreshMissionListActiveState();

        await switchWorkspace("overview");

    } catch (error) {

        console.error(
            "[Mission] 規劃確認失敗:",
            error
        );

        alert(
            "確認規劃失敗：" +
            error.message
        );

    } finally {

        button.disabled = false;

        button.textContent = "確認規劃 →";
    }
});