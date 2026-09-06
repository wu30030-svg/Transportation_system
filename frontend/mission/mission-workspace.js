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

function switchWorkspace(workspace) {

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

        initMap();

    }

}