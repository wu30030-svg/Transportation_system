let draggedMonitoringItem = null;


// ========================================
// CCTV Stream Manager
// ========================================
//
// 負責：
// 1. MJPEG Backend Relay
// 2. JPEG Snapshot Backend Relay
// 3. CCTV 畫面顯示 / NO SIGNAL
// 4. CCTV 離開 Workspace 時停止
//
// 不負責：
// - CCTV Source 直接連線
// - MJPEG Auto Reconnect
// - MJPEG Watchdog
// - CCTV 資料查詢
// - Mission Monitoring CRUD
//
// Backend 負責：
// - MJPEG Relay
// - MJPEG Watchdog
// - MJPEG Auto Reconnect
// - Snapshot 單次取得
// ========================================


// ========================================
// CCTV Snapshot Refresh Interval
// ========================================

const CCTV_SNAPSHOT_INTERVAL_MS = 1000;


// ========================================
// CCTV Snapshot Timer
// ========================================

const cctvSnapshotTimers =
    new Map();


// ========================================
// Get CCTV Relay URL
// ========================================

function getCctvRelayUrl(cameraId) {

    if (!cameraId) {
        return "";
    }

    const apiBaseUrl =
        CONFIG.API_BASE_URL;

    if (!apiBaseUrl) {

        console.error(
            "[CCTV] CONFIG.API_BASE_URL 不存在。"
        );

        return "";
    }

    return `${apiBaseUrl}/api/cctv/stream/${encodeURIComponent(cameraId)}`;
}


// ========================================
// Get CCTV Snapshot URL
// ========================================

function getCctvSnapshotUrl(cameraId) {

    if (!cameraId) {
        return "";
    }

    const apiBaseUrl =
        CONFIG.API_BASE_URL;

    if (!apiBaseUrl) {

        console.error(
            "[CCTV] CONFIG.API_BASE_URL 不存在。"
        );

        return "";
    }

    return `${apiBaseUrl}/api/cctv/snapshot/${encodeURIComponent(cameraId)}`;
}


// ========================================
// Stop Snapshot Refresh
// ========================================

function stopCctvSnapshotRefresh(image) {

    if (!image) {
        return;
    }


    const timer =
        cctvSnapshotTimers.get(
            image
        );


    if (timer) {

        clearTimeout(timer);

        cctvSnapshotTimers.delete(
            image
        );
    }
}


// ========================================
// Start Snapshot Refresh
// ========================================

function startCctvSnapshotRefresh(image) {

    if (!image) {
        return;
    }


    const cameraId =
        image.dataset.cameraId || "";


    if (!cameraId) {

        console.warn(
            "[CCTV Snapshot] Camera ID 不存在。"
        );

        return;
    }


    stopCctvSnapshotRefresh(
        image
    );


    const snapshotUrl =
        getCctvSnapshotUrl(
            cameraId
        );


    if (!snapshotUrl) {
        return;
    }


    image.dataset.cctvStopped =
        "false";


    async function loadSnapshot() {

        if (
            image.dataset.cctvStopped ===
            "true"
        ) {
            return;
        }


        if (!document.body.contains(image)) {

            stopCctvSnapshotRefresh(
                image
            );

            return;
        }


        const requestUrl =
            `${snapshotUrl}?t=${Date.now()}`;


        try {

            const response =
                await fetch(
                    requestUrl,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }


            const blob =
                await response.blob();


            if (
                image.dataset.cctvStopped ===
                "true"
            ) {
                return;
            }


            const objectUrl =
                URL.createObjectURL(
                    blob
                );


            const previousObjectUrl =
                image.dataset.objectUrl;


            image.src =
                objectUrl;


            image.dataset.objectUrl =
                objectUrl;


            if (previousObjectUrl) {

                URL.revokeObjectURL(
                    previousObjectUrl
                );
            }


            image.style.display =
                "block";


            const noSignal =
                image.nextElementSibling;


            if (noSignal) {

                noSignal.style.display =
                    "none";
            }


            console.log(
                "[CCTV Snapshot] 更新:",
                cameraId
            );


        } catch (error) {

            console.warn(
                "[CCTV Snapshot] 更新失敗:",
                cameraId,
                error.message
            );


            if (
                image.dataset.cctvStopped !==
                "true"
            ) {

                const noSignal =
                    image.nextElementSibling;


                if (noSignal) {

                    noSignal.style.display =
                        "flex";
                }
            }
        }


        if (
            image.dataset.cctvStopped ===
            "true"
        ) {
            return;
        }


        const timer =
            setTimeout(
                loadSnapshot,
                CCTV_SNAPSHOT_INTERVAL_MS
            );


        cctvSnapshotTimers.set(
            image,
            timer
        );
    }


    loadSnapshot();
}


// ========================================
// Stop All CCTV Streams
// ========================================

function stopAllCctvStreams(containerId) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    const images =
        container.querySelectorAll(
            "img[data-camera-id]"
        );


    images.forEach(image => {

        image.dataset.cctvStopped =
            "true";


        // ========================================
        // Stop Snapshot Timer
        // ========================================

        stopCctvSnapshotRefresh(
            image
        );


        // ========================================
        // Release Object URL
        // ========================================

        const objectUrl =
            image.dataset.objectUrl;


        if (objectUrl) {

            URL.revokeObjectURL(
                objectUrl
            );

            delete image.dataset.objectUrl;
        }


        // ========================================
        // Stop Backend Relay
        // ========================================

        image.removeAttribute(
            "src"
        );
    });


    console.log(
        "[CCTV] 已停止 CCTV:",
        containerId,
        images.length
    );
}


// ========================================
// Get CCTV Source Type
// ========================================
//
// 透過 Backend Source API 判斷：
// - .jpg / .jpeg / .png → Snapshot
// - 其他 → MJPEG Relay
//
// 第一版先依 Source URL 判斷。
// 不修改 cameras 資料表。
// ========================================

async function getCctvDisplayType(
    cameraId
) {

    try {

        const apiBaseUrl =
            CONFIG.API_BASE_URL;


        const response =
            await fetch(
                `${apiBaseUrl}/api/cctv/source/${encodeURIComponent(cameraId)}`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const result =
            await response.json();


        const camera =
            result?.data;


        const cameraUrl =
            camera?.camera_url || "";


        const isSnapshot =
            /\.(jpg|jpeg|png)(\?.*)?$/i.test(
                cameraUrl
            );


        return isSnapshot
            ? "snapshot"
            : "mjpeg";


    } catch (error) {

        console.warn(
            "[CCTV] 無法判斷 Source Type，預設使用 MJPEG:",
            cameraId,
            error.message
        );


        return "mjpeg";
    }
}


// ========================================
// Start CCTV Streams
// ========================================

async function startCctvStreams(
    containerId
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    const images =
        container.querySelectorAll(
            "img[data-camera-id]"
        );


    for (const image of images) {

        const cameraId =
            image.dataset.cameraId || "";


        if (!cameraId) {

            console.warn(
                "[CCTV] Camera ID 不存在。"
            );

            continue;
        }


        const displayType =
            await getCctvDisplayType(
                cameraId
            );


        if (
            image.dataset.cctvStopped ===
            "true"
        ) {
            continue;
        }


        // ========================================
        // Snapshot
        // ========================================

        if (
            displayType ===
            "snapshot"
        ) {

            console.log(
                "[CCTV] 建立 Snapshot:",
                cameraId
            );


            startCctvSnapshotRefresh(
                image
            );


            continue;
        }


        // ========================================
        // MJPEG Relay
        // ========================================

        const relayUrl =
            getCctvRelayUrl(
                cameraId
            );


        if (!relayUrl) {
            continue;
        }


        image.dataset.cctvStopped =
            "false";


        image.style.display =
            "block";


        const noSignal =
            image.nextElementSibling;


        if (noSignal) {

            noSignal.style.display =
                "none";
        }


        image.src =
            relayUrl;


        console.log(
            "[CCTV] 建立 Backend MJPEG Relay:",
            cameraId,
            relayUrl
        );
    }


    console.log(
        "[CCTV] CCTV 顯示已啟動:",
        containerId,
        images.length
    );
}

// ========================================
// CCTV Preview
// ========================================

function createCctvPreviewHtml(camera) {

    const cameraId =
        camera.camera_id || "";

    return `
            <div class="cctv-preview">

                <div class="cctv-preview-screen">

                    <img
                        class="cctv-preview-image"
                        data-camera-id="${cameraId}"
                        data-cctv-stopped="false"
                        alt="${camera.camera_name || "CCTV"}"
                    >

                    <div
                        class="cctv-preview-no-signal"
                        style="display:none;"
                    >
                        NO SIGNAL
                    </div>

                </div>

                <div class="cctv-preview-footer">

                    <div class="cctv-preview-name">
                        ${camera.camera_name || "未命名 CCTV"}
                    </div>

                    <div class="cctv-preview-id">
                        ${cameraId || "--------"}
                    </div>

                </div>

            </div>
        `;
}

// ========================================
// Mission Monitoring Load
// ========================================

async function loadMissionMonitoring() {

    if (!currentMission) {

        console.warn(
            "[Mission Monitoring] No mission selected."
        );

        return [];

    }


    // ========================================
    // 判斷目前 Workspace
    // ========================================

    const activeWorkspace =
        document.querySelector(
            ".workspace-tab.active"
        )?.dataset.workspace;


    try {

        const response =
            await getMissionMonitorings(
                currentMission.id
            );

        const monitorings =
            response.data || [];


        console.log(
            "[Mission Monitoring] Load success:",
            monitorings
        );


        // ========================================
        // 04 監控 Workspace
        // ========================================

        if (
            activeWorkspace === "monitoring"
        ) {

            renderMissionMonitoring(
                monitorings
            );

        }


        // ========================================
        // 05 執行 Workspace
        // ========================================

        if (
            activeWorkspace === "execution"
        ) {

            renderExecutionMonitoring(
                monitorings
            );

        }


        return monitorings;


    } catch (error) {

        console.error(
            "[Mission Monitoring] Load failed:",
            error
        );


        if (
            activeWorkspace === "monitoring"
        ) {

            renderMissionMonitoring([]);

        }


        if (
            activeWorkspace === "execution"
        ) {

            renderExecutionMonitoring([]);

        }


        return [];

    }
}

// ========================================
// Render Mission Monitoring
// ========================================

function renderMissionMonitoring(monitorings) {

    const listElement =
        document.getElementById(
            "mission-monitoring-list"
        );

    const emptyStateElement =
        document.getElementById(
            "monitoring-empty-state"
        );

    const totalCountElement =
        document.getElementById(
            "monitoring-total-count"
        );

    if (
        !listElement ||
        !emptyStateElement ||
        !totalCountElement
    ) {

        console.warn(
            "[Mission Monitoring] Monitoring UI elements not found."
        );

        return;
    }

    const monitoringList =
        Array.isArray(monitorings)
            ? monitorings
            : [];

    totalCountElement.textContent =
        String(
            monitoringList.length
        ).padStart(2, "0");

    if (monitoringList.length === 0) {

        // 先停止目前存在的 CCTV
        stopAllCctvStreams(
            "mission-monitoring-list"
        );

        listElement.innerHTML = "";

        listElement.classList.add(
            "hidden"
        );

        emptyStateElement.classList.remove(
            "hidden"
        );

        return;
    }

    emptyStateElement.classList.add(
        "hidden"
    );

    listElement.classList.remove(
        "hidden"
    );

    // 先停止舊的 CCTV 串流
    stopAllCctvStreams(
        "mission-monitoring-list"
    );

    listElement.innerHTML =
        monitoringList
            .map((monitoring) => {

                const pinnedText =
                    monitoring.is_pinned
                        ? "已釘選"
                        : "未釘選";

                return `
                    <div
                        class="mission-monitoring-item"
                        draggable="true"
                        data-monitoring-id="${monitoring.id}"
                        data-pinned="${monitoring.is_pinned}"
                    >

                        <div class="mission-monitoring-preview">

                            ${createCctvPreviewHtml(monitoring)}

                        </div>

                        <div class="mission-monitoring-controls">

                            <div class="mission-monitoring-status">
                                ${pinnedText}
                            </div>

                            <button
                                type="button"
                                class="mission-monitoring-pin-button"
                                data-monitoring-id="${monitoring.id}"
                                data-pinned="${monitoring.is_pinned}"
                            >
                                ${monitoring.is_pinned
                        ? "取消釘選"
                        : "釘選"
                    }
                            </button>

                            <button
                                type="button"
                                class="mission-monitoring-delete-button"
                                data-monitoring-id="${monitoring.id}"
                            >
                                刪除
                            </button>

                        </div>

                    </div>
                `;

            })
            .join("");

    // 啟動新的 CCTV 串流管理
    startCctvStreams(
        "mission-monitoring-list"
    );
}

// ========================================
// Pin / Unpin
// ========================================

document.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                ".mission-monitoring-pin-button"
            );

        if (!button) {
            return;
        }

        if (!currentMission) {

            alert(
                "目前沒有選擇任務。"
            );

            return;
        }

        const monitoringId =
            button.dataset.monitoringId;

        const isPinned =
            button.dataset.pinned === "true";

        if (!monitoringId) {

            console.error(
                "[Mission Monitoring] Monitoring ID 不存在。"
            );

            return;
        }

        try {

            button.disabled = true;

            if (isPinned) {

                await unpinMissionMonitoring(
                    currentMission.id,
                    monitoringId
                );

            } else {

                await pinMissionMonitoring(
                    currentMission.id,
                    monitoringId
                );
            }

            await loadMissionMonitoring();

        } catch (error) {

            console.error(
                "[Mission Monitoring] Pin/Unpin failed:",
                error
            );

            alert(
                (isPinned
                    ? "取消釘選失敗："
                    : "釘選失敗：")
                + error.message
            );

            button.disabled = false;
        }
    }
);

// ========================================
// Delete
// ========================================

document.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                ".mission-monitoring-delete-button"
            );

        if (!button) {
            return;
        }

        if (!currentMission) {

            alert(
                "目前沒有選擇任務。"
            );

            return;
        }

        const monitoringId =
            button.dataset.monitoringId;

        if (!monitoringId) {

            console.error(
                "[Mission Monitoring] Monitoring ID 不存在。"
            );

            return;
        }

        const confirmed =
            confirm(
                "確定要移除此監控嗎？"
            );

        if (!confirmed) {
            return;
        }

        try {

            button.disabled = true;

            await deleteMissionMonitoring(
                currentMission.id,
                monitoringId
            );

            await loadMissionMonitoring();

        } catch (error) {

            console.error(
                "[Mission Monitoring] Delete failed:",
                error
            );

            alert(
                "刪除監控失敗：" +
                error.message
            );

            button.disabled = false;
        }
    }
);

// ========================================
// Drag / Drop
// ========================================

document.addEventListener(
    "dragstart",
    (event) => {

        const item =
            event.target.closest(
                ".mission-monitoring-item"
            );

        if (!item) {
            return;
        }

        draggedMonitoringItem =
            item;

        console.log(
            "[Mission Monitoring] Drag start:",
            item.dataset.monitoringId
        );
    }
);

document.addEventListener(
    "dragover",
    (event) => {

        const item =
            event.target.closest(
                ".mission-monitoring-item"
            );

        if (!item) {
            return;
        }

        if (!draggedMonitoringItem) {
            return;
        }

        event.preventDefault();
    }
);

document.addEventListener(
    "drop",
    async (event) => {

        const targetItem =
            event.target.closest(
                ".mission-monitoring-item"
            );

        if (!targetItem) {
            return;
        }

        if (!draggedMonitoringItem) {
            return;
        }

        event.preventDefault();

        const sourceItem =
            draggedMonitoringItem;

        draggedMonitoringItem =
            null;

        if (
            sourceItem === targetItem
        ) {
            return;
        }

        const sourceMonitoringId =
            sourceItem.dataset.monitoringId;

        const targetMonitoringId =
            targetItem.dataset.monitoringId;

        const sourcePinned =
            sourceItem.dataset.pinned === "true";

        const targetPinned =
            targetItem.dataset.pinned === "true";

        if (
            !sourceMonitoringId ||
            !targetMonitoringId
        ) {

            console.error(
                "[Mission Monitoring] Monitoring ID 不存在。"
            );

            return;
        }

        if (
            sourcePinned !== targetPinned
        ) {

            alert(
                "已釘選與未釘選監控不能互相交換。"
            );

            return;
        }

        if (!currentMission) {

            alert(
                "目前沒有選擇任務。"
            );

            return;
        }

        try {

            await swapMissionMonitoring(
                currentMission.id,
                sourceMonitoringId,
                targetMonitoringId
            );

            await loadMissionMonitoring();

        } catch (error) {

            console.error(
                "[Mission Monitoring] Swap failed:",
                error
            );

            alert(
                "監控交換失敗：" +
                error.message
            );
        }
    }
);

// ========================================
// Planning Confirmation
// ========================================

document.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                "#monitoring-next-btn"
            );

        if (!button) {
            return;
        }

        if (!currentMission) {

            alert(
                "目前沒有選擇任務。"
            );

            return;
        }


        // ========================================
        // 只有 PLANNED 才能進入完成規劃
        // ========================================

        if (currentMission.status !== "PLANNED") {

            console.warn(
                "[Mission Monitoring] 目前任務狀態不可進入完成規劃:",
                currentMission.status
            );

            alert(
                "目前任務已完成規劃，無法再次進入完成規劃。"
            );

            if (
                typeof switchWorkspace === "function"
            ) {

                switchWorkspace("overview");

            }

            return;
        }


        showPlanningConfirmation();
    }
);

// ========================================
// Stop Execution Monitoring
// ========================================

function stopExecutionMonitoring() {

    stopAllCctvStreams(
        "execution-monitor-list"
    );

    console.log(
        "[Execution Monitoring] CCTV 串流已停止。"
    );
}


// ========================================
// Start Execution Monitoring
// ========================================

function startExecutionMonitoring() {

    startCctvStreams(
        "execution-monitor-list"
    );

    console.log(
        "[Execution Monitoring] CCTV 串流已啟動。"
    );
}

// ========================================
// Execution Monitoring
// ========================================

function renderExecutionMonitoring(
    monitorings
) {

    const listElement =
        document.getElementById(
            "execution-monitor-list"
        );

    if (!listElement) {

        console.warn(
            "[Execution Monitoring] 找不到 execution-monitor-list。"
        );

        return;
    }

    const monitoringList =
        Array.isArray(monitorings)
            ? monitorings
            : [];

    if (monitoringList.length === 0) {

        stopAllCctvStreams(
            "execution-monitor-list"
        );

        listElement.innerHTML = `
                <div class="execution-monitor-empty">
                    目前沒有任務監控。
                </div>
            `;

        return;
    }

    // 先停止舊的 CCTV 串流
    stopAllCctvStreams(
        "execution-monitor-list"
    );

    listElement.innerHTML =
        monitoringList
            .map((monitoring) => {

                return `
                    <div
                        class="execution-monitor-camera"
                        data-monitoring-id="${monitoring.id}"
                    >

                        <div class="execution-monitor-screen">

                            <img
                                class="execution-monitor-image"
                                data-camera-id="${monitoring.camera_id || ""}"
                                data-cctv-stopped="false"
                                alt="${monitoring.camera_name || "CCTV"}"
                            >

                            <div
                                class="execution-monitor-no-signal"
                                style="display:none;"
                            >
                                NO SIGNAL
                            </div>

                        </div>

                        <div class="execution-monitor-meta">

                            <div class="execution-monitor-name">
                                ${monitoring.camera_name || "未命名 CCTV"}
                            </div>

                            <div class="execution-monitor-camera-id">
                                ${monitoring.camera_id || "--------"}
                            </div>

                        </div>

                    </div>
                `;

            })
            .join("");

}

