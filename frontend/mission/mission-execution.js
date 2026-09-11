// ========================================
// Mission Execution
// ========================================
//
// 負責：
// 1. READY → RUNNING
// 2. RUNNING → COMPLETED
// 3. RUNNING → ABORTED
// 4. 執行地圖初始化
// 5. 顯示已確認任務路線
// 6. 執行期間的 Mission Command UI
//
// 不負責：
// - 路線規劃
// - GPS 位置取得
// - CCTV 資料來源
// - 任務事件
// - 直接修改 Mission Status
//
// Mission Status 一律由 Backend Command API 決定。
// ========================================


// ========================================
// Execution Map
// ========================================

let executionMap = null;

let executionRoutePolyline = null;


// ========================================
// Execution Command State
// ========================================

let executionCommandProcessing = false;


// ========================================
// Initialize Execution Map
// ========================================

async function initExecutionMap() {

    const mapContainer =
        document.getElementById("execution-map");

    if (!mapContainer) {

        console.warn(
            "[Execution Map] 找不到 execution-map。"
        );

        return;

    }


    if (executionMap) {

        console.log(
            "[Execution Map] 地圖已初始化，跳過重新建立。"
        );

        await drawExecutionRoute();

        if (
            typeof initTracking === "function"
        ) {

            initTracking();

        }

        return;

    }


    await google.maps.importLibrary("marker");
    await google.maps.importLibrary("geometry");


    const targetLocation = {
        lat: 24.239268,
        lng: 120.623498
    };


    executionMap =
        new google.maps.Map(
            mapContainer,
            {
                center: targetLocation,
                zoom: 14,
                mapId: CLEAN_MAP_ID,
                disableDefaultUI: false
            }
        );


    console.log(
        "[Execution Map] 執行地圖初始化完成。"
    );


    // ========================================
    // 載入已確認任務路線
    // ========================================

    await drawExecutionRoute();


    // ========================================
    // 初始化 Tracking
    // ========================================

    if (
        typeof initTracking === "function"
    ) {

        initTracking();

    }
}


// ========================================
// Draw Confirmed Mission Route
// ========================================

async function drawExecutionRoute() {

    if (!executionMap) {

        console.warn(
            "[Execution Route] executionMap 尚未初始化。"
        );

        return;

    }


    if (!currentMission) {

        console.warn(
            "[Execution Route] 目前沒有選擇任務。"
        );

        return;

    }


    let missionRoute =
        currentMission.route || null;


    // 如果 currentMission.route 沒有資料，
    // 再從 Backend 取得一次
    if (!missionRoute) {

        try {

            const response =
                await getMissionRoute(
                    currentMission.id
                );

            missionRoute =
                response?.data || null;

        } catch (error) {

            console.warn(
                "[Execution Route] 無法取得任務路線:",
                error
            );

            return;

        }

    }


    if (
        !missionRoute ||
        !Array.isArray(missionRoute.geometry) ||
        missionRoute.geometry.length === 0
    ) {

        console.warn(
            "[Execution Route] 任務沒有已確認路線。"
        );

        return;

    }


    // ========================================
    // 清除舊路線
    // ========================================

    if (executionRoutePolyline) {

        executionRoutePolyline.setMap(null);

        executionRoutePolyline = null;

    }


    // ========================================
    // 建立 Google Maps LatLng 路徑
    // ========================================

    const routePath =
        missionRoute.geometry.map(
            point =>
                new google.maps.LatLng(
                    Number(point.lat),
                    Number(point.lng)
                )
        );


    if (routePath.length === 0) {

        console.warn(
            "[Execution Route] 路線 geometry 為空。"
        );

        return;

    }


    // ========================================
    // 畫出已確認路線
    // ========================================

    executionRoutePolyline =
        new google.maps.Polyline({

            path: routePath,

            geodesic: true,

            strokeOpacity: 1.0,

            strokeWeight: 5,

            map: executionMap

        });


    // ========================================
    // 自動縮放到整條任務路線
    // ========================================

    const bounds =
        new google.maps.LatLngBounds();


    routePath.forEach(
        point => bounds.extend(point)
    );


    executionMap.fitBounds(bounds);


    console.log(
        "[Execution Route] 已確認路線載入完成:",
        routePath.length,
        "個路線點"
    );

}


// ========================================
// Start Mission Execution
// ========================================

async function handleStartExecution() {

    if (!currentMission) {

        alert("目前沒有選擇任務。");

        return;

    }


    if (currentMission.status !== "READY") {

        alert(
            "只有待執行任務可以開始執行。"
        );

        return;

    }


    if (executionCommandProcessing) {

        return;

    }


    executionCommandProcessing = true;


    setExecutionCommandButtonsDisabled(true);


    try {

        const response =
            await startMissionRun(
                currentMission.id
            );


        currentMissionRun =
            response?.data?.missionRun || null;


        if (!currentMissionRun) {

            throw new Error(
                "Mission Run 建立成功，但沒有取得 Mission Run 資料。"
            );

        }


        console.log(
            "[Mission Run] 開始執行成功:",
            currentMissionRun
        );


        await selectMission(
            currentMission.id
        );


        await loadMissions();

        refreshMissionListActiveState();


        await switchWorkspace(
            "execution"
        );


    } catch (error) {

        console.error(
            "[Mission Run] 開始執行失敗:",
            error
        );


        alert(
            "開始執行失敗：" +
            error.message
        );

    } finally {

        executionCommandProcessing = false;

        setExecutionCommandButtonsDisabled(false);

    }

}


// ========================================
// Start Execution Button
// ========================================

document
    .getElementById("startExecutionBtn")
    ?.addEventListener(
        "click",
        handleStartExecution
    );


// ========================================
// Complete Mission
// ========================================

async function handleCompleteMission() {

    if (!currentMission) {

        alert(
            "目前沒有選擇任務。"
        );

        return;

    }


    if (currentMission.status !== "RUNNING") {

        alert(
            "只有執行中的任務可以完成。"
        );

        return;

    }


    if (!currentMissionRun) {

        alert(
            "找不到目前 Mission Run，無法完成任務。"
        );

        return;

    }


    openCompleteMissionModal();

}


// ========================================
// Execute Complete Command
// ========================================

async function executeCompleteMission() {

    if (
        executionCommandProcessing
    ) {

        return;

    }


    if (
        !currentMission ||
        !currentMissionRun
    ) {

        return;

    }


    executionCommandProcessing = true;


    setExecutionCommandButtonsDisabled(
        true
    );


    try {

        console.log(
            "[Mission Run] 發送完成任務 Command..."
        );


        const response =
            await completeMissionRun(
                currentMission.id,
                currentMissionRun.id
            );


        console.log(
            "[Mission Run] 任務完成成功:",
            response
        );


        // ========================================
        // 停止 Tracking
        // ========================================

        stopExecutionTracking();


        // ========================================
        // 關閉 Execution CCTV
        // ========================================

        stopExecutionMonitoringPanel();


        // ========================================
        // 清除目前 Mission Run
        // ========================================

        currentMissionRun = null;


        // ========================================
        // 重新取得 Mission
        // ========================================

        await selectMission(
            currentMission.id
        );


        await loadMissions();

        refreshMissionListActiveState();


        // ========================================
        // 回到 Mission Report
        // ========================================

        await switchWorkspace(
            "report"
        );


        alert(
            "任務已完成，任務車輛已釋放。"
        );


    } catch (error) {

        console.error(
            "[Mission Run] 完成任務失敗:",
            error
        );


        alert(
            "完成任務失敗：" +
            error.message
        );

    } finally {

        executionCommandProcessing = false;

        setExecutionCommandButtonsDisabled(
            false
        );

    }

}


// ========================================
// Abort Mission
// ========================================

async function handleAbortMission() {

    if (!currentMission) {

        alert(
            "目前沒有選擇任務。"
        );

        return;

    }


    if (currentMission.status !== "RUNNING") {

        alert(
            "只有執行中的任務可以中止。"
        );

        return;

    }


    if (!currentMissionRun) {

        alert(
            "找不到目前 Mission Run，無法中止任務。"
        );

        return;

    }


    openAbortMissionModal();

}


// ========================================
// Execute Abort Command
// ========================================

async function executeAbortMission() {

    if (
        executionCommandProcessing
    ) {

        return;

    }


    if (
        !currentMission ||
        !currentMissionRun
    ) {

        return;

    }


    executionCommandProcessing = true;


    setExecutionCommandButtonsDisabled(
        true
    );


    try {

        console.log(
            "[Mission Run] 發送中止任務 Command..."
        );


        const response =
            await abortMissionRun(
                currentMission.id,
                currentMissionRun.id
            );


        console.log(
            "[Mission Run] 任務中止成功:",
            response
        );


        // ========================================
        // 停止 Tracking
        // ========================================

        stopExecutionTracking();


        // ========================================
        // 關閉 Execution CCTV
        // ========================================

        stopExecutionMonitoringPanel();


        // ========================================
        // 清除目前 Mission Run
        // ========================================

        currentMissionRun = null;


        // ========================================
        // 重新取得 Mission
        // ========================================

        await selectMission(
            currentMission.id
        );


        await loadMissions();

        refreshMissionListActiveState();


        // ========================================
        // 回到 Mission Report
        // ========================================

        await switchWorkspace(
            "report"
        );


        alert(
            "任務已中止，任務車輛已釋放。"
        );


    } catch (error) {

        console.error(
            "[Mission Run] 中止任務失敗:",
            error
        );


        alert(
            "中止任務失敗：" +
            error.message
        );

    } finally {

        executionCommandProcessing = false;

        setExecutionCommandButtonsDisabled(
            false
        );

    }

}


// ========================================
// Stop Execution Tracking
// ========================================

function stopExecutionTracking() {

    try {

        if (
            typeof stopMissionLocationPolling === "function"
        ) {

            stopMissionLocationPolling();

            console.log(
                "[Mission Run] 車隊 Tracking 輪詢已停止。"
            );

        }

        if (
            typeof stopTrackingSimulation === "function"
        ) {

            stopTrackingSimulation();

        }

        if (
            typeof stopPhoneTracking === "function"
        ) {

            stopPhoneTracking();

        }

    } catch (error) {

        console.warn(
            "[Mission Run] 停止 Tracking 時發生錯誤:",
            error
        );

    }

}


// ========================================
// Stop Execution Monitoring
// ========================================

function stopExecutionMonitoringPanel() {

    try {

        if (
            typeof stopExecutionMonitoring === "function"
        ) {

            stopExecutionMonitoring();

        }

    } catch (error) {

        console.warn(
            "[Execution Monitor] 停止監控時發生錯誤:",
            error
        );

    }


    executionMonitorPanel
        ?.classList.remove("open");

}


// ========================================
// Execution Command Buttons
// ========================================

function setExecutionCommandButtonsDisabled(
    disabled
) {

    const completeButton =
        document.getElementById(
            "completeMissionBtn"
        );

    const abortButton =
        document.getElementById(
            "abortMissionBtn"
        );


    if (completeButton) {

        completeButton.disabled =
            disabled;

    }


    if (abortButton) {

        abortButton.disabled =
            disabled;

    }


    const completeConfirmButton =
        document.getElementById(
            "complete-mission-confirm-btn"
        );

    const abortConfirmButton =
        document.getElementById(
            "abort-mission-confirm-btn"
        );


    if (completeConfirmButton) {

        completeConfirmButton.disabled =
            disabled;

    }


    if (abortConfirmButton) {

        abortConfirmButton.disabled =
            disabled;

    }

}


// ========================================
// Complete Mission Modal
// ========================================

function openCompleteMissionModal() {

    const overlay =
        document.getElementById(
            "complete-mission-modal-overlay"
        );


    if (!overlay) {

        console.warn(
            "[Complete Mission] 找不到確認視窗。"
        );

        return;

    }


    overlay.classList.add("open");

}


function closeCompleteMissionModal() {

    const overlay =
        document.getElementById(
            "complete-mission-modal-overlay"
        );


    overlay?.classList.remove("open");

}


// ========================================
// Abort Mission Modal
// ========================================

function openAbortMissionModal() {

    const overlay =
        document.getElementById(
            "abort-mission-modal-overlay"
        );


    if (!overlay) {

        console.warn(
            "[Abort Mission] 找不到確認視窗。"
        );

        return;

    }


    overlay.classList.add("open");

}


function closeAbortMissionModal() {

    const overlay =
        document.getElementById(
            "abort-mission-modal-overlay"
        );


    overlay?.classList.remove("open");

}


// ========================================
// Complete Mission Confirm Button
// ========================================

document
    .getElementById(
        "complete-mission-confirm-btn"
    )
    ?.addEventListener(
        "click",
        async () => {

            closeCompleteMissionModal();

            await executeCompleteMission();

        }
    );


// ========================================
// Abort Mission Confirm Button
// ========================================

document
    .getElementById(
        "abort-mission-confirm-btn"
    )
    ?.addEventListener(
        "click",
        async () => {

            closeAbortMissionModal();

            await executeAbortMission();

        }
    );


// ========================================
// Execution Command Buttons
// ========================================

document
    .getElementById(
        "completeMissionBtn"
    )
    ?.addEventListener(
        "click",
        handleCompleteMission
    );


document
    .getElementById(
        "abortMissionBtn"
    )
    ?.addEventListener(
        "click",
        handleAbortMission
    );


// ========================================
// ESC Close Modal
// ========================================

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {

            return;

        }


        closeCompleteMissionModal();

        closeAbortMissionModal();

    }
);


// ========================================
// Execution Monitor Panel
// ========================================

const executionMonitorToggle =
    document.getElementById(
        "execution-monitor-toggle"
    );

const executionMonitorPanel =
    document.getElementById(
        "execution-monitor-panel"
    );

const executionMonitorClose =
    document.getElementById(
        "execution-monitor-close"
    );


// ========================================
// Open CCTV Panel
// ========================================

executionMonitorToggle
    ?.addEventListener(
        "click",
        () => {

            executionMonitorPanel
                ?.classList.add("open");


            if (
                typeof startExecutionMonitoring === "function"
            ) {

                startExecutionMonitoring();

            }

        }
    );


// ========================================
// Close CCTV Panel
// ========================================

executionMonitorClose
    ?.addEventListener(
        "click",
        () => {

            if (
                typeof stopExecutionMonitoring === "function"
            ) {

                stopExecutionMonitoring();

            }


            executionMonitorPanel
                ?.classList.remove("open");

        }
    );