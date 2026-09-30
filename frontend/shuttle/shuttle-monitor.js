console.log("[Shuttle Monitor] A 路線監控端啟動");

// ========================================
// Configuration
// ========================================

const SHUTTLE_LOCATION_API =
    `${CONFIG.API_BASE_URL}/api/tracking/shuttle/current`;

const SHUTTLE_REFRESH_INTERVAL = 5000;


// ========================================
// State
// ========================================

let shuttleLocations = [];

// ========================================
// WebSocket State
// ========================================

let shuttleOnlineUsers = [];

// ========================================
// WebSocket Connection
// ========================================

function connectShuttleWebSocket() {

    const token = getAuthToken();

    if (!token) {

        console.error(
            "[Shuttle WebSocket] 沒有登入 Token"
        );

        return;
    }

    const wsBaseUrl =
        CONFIG.API_BASE_URL.replace(/^http/, "ws");

    const wsUrl =
        `${wsBaseUrl}/ws`;

    ShuttleMonitorWebSocket.connect({

        url: wsUrl,

        token,

        messageHandler:
            handleShuttleWebSocketMessage

    });

}

// ========================================
// WebSocket Message Handler
// ========================================

async function handleShuttleWebSocketMessage(data) {

    // ========================================
    // Authentication Success
    // ========================================

    if (data.type === "auth:success") {

        console.log(
            "[Shuttle WebSocket] Authentication success:",
            data.user
        );

        ShuttleMonitorWebSocket.send({
            type: "online:list"
        });

        return;
    }


    // ========================================
    // Online User List
    // ========================================

    if (data.type === "online:list") {

        shuttleOnlineUsers =
            Array.isArray(data.users)
                ? data.users
                : [];

        console.log(
            "[Shuttle WebSocket] Online users:",
            shuttleOnlineUsers
        );


        // WebSocket 在線名單更新後
        // 立即重新整理通訊面板

        renderCommunicationPanel();

        return;
    }

    // ========================================
    // Call Incoming
    // ========================================

    if (data.type === "call:incoming") {

        console.log(
            "[Shuttle Communication] 收到來電:",
            data
        );

        return;
    }

    // ========================================
    // Call Accepted
    // ========================================

    if (data.type === "call:accepted") {

        console.log(
            "[Shuttle Communication] 對方已接聽:",
            data
        );


        if (!data.call_id) {

            console.warn(
                "[Shuttle Communication] call:accepted 缺少 call_id"
            );

            return;
        }


        const currentCallState =
            ShuttleCall.getState();


        if (!currentCallState.activeCallTarget) {

            console.warn(
                "[Shuttle Communication] 找不到目前通話目標"
            );

            return;
        }


        ShuttleCall.setCall({

            callId:
                data.call_id,

            target:
                currentCallState.activeCallTarget,

            state:
                "CONNECTED"

        });


        ShuttleCall.setStarted();

        updateCallWindow();

        ShuttleCall.startTimer();


        startShuttleWebRTCAsCaller(
            data.call_id
        );


        return;
    }

    // ========================================
    // WebRTC Answer
    // ========================================

    if (
        data.type ===
        "call:webrtc-answer"
    ) {

        handleShuttleWebRTCAnswer(
            data
        );

        return;
    }

    if (
        data.type ===
        "call:webrtc-ice"
    ) {

        console.log(
            "[WebRTC] Monitor 收到 ICE Candidate:",
            data.call_id
        );


        const callState =
            ShuttleCall.getState();


        if (
            data.call_id !==
            callState.activeCallId
        ) {

            console.warn(
                "[WebRTC] ICE 不屬於目前通話:",
                data.call_id
            );

            return;
        }


        if (
            !data.candidate
        ) {

            console.warn(
                "[WebRTC] ICE Candidate 資料不存在"
            );

            return;
        }


        await ShuttleWebRTC.handleIceCandidate(
            data.candidate
        );


        return;
    }

    // ========================================
    // Call Rejected
    // ========================================

    if (data.type === "call:rejected") {

        console.log(
            "[Shuttle Communication] 對方拒絕通話:",
            data
        );

        closeCallWindow();

        return;
    }


    // ========================================
    // Call Ended
    // ========================================

    if (data.type === "call:ended") {

        console.log(
            "[Shuttle Communication] 通話結束:",
            data
        );

        closeCallWindow();

        return;
    }


    // ========================================
    // Call Error
    // ========================================

    if (data.type === "call:error") {

        console.warn(
            "[Shuttle Communication] 通話錯誤:",
            data
        );

        closeCallWindow();

        return;
    }

    // ========================================
    // Force Logout
    // ========================================

    if (data.type === "auth:force-logout") {

        console.warn(
            "[Shuttle WebSocket] 收到強制登出"
        );

        if (
            typeof handleUnauthorized ===
            "function"
        ) {

            handleUnauthorized();

        }

        return;
    }
}

// ========================================
// WebRTC - Answer
// ========================================

async function handleShuttleWebRTCAnswer(
    data
) {

    const callId =
        data.call_id;

    const answer =
        data.answer;


    console.log(
        "[WebRTC] Monitor 收到 Answer:",
        callId
    );


    if (!callId || !answer) {

        console.warn(
            "[WebRTC] Answer 資料不完整"
        );

        return;
    }


    const callState =
        ShuttleCall.getState();


    if (
        callId !==
        callState.activeCallId
    ) {

        console.warn(
            "[WebRTC] Answer 不屬於目前通話:",
            callId
        );

        return;
    }


    await ShuttleWebRTC.handleAnswer(
        answer
    );

}

// ========================================
// WebRTC - Remote Stream
// ========================================

function handleShuttleRemoteStream(
    remoteStream
) {

    console.log(
        "[WebRTC] Monitor 收到 Remote Stream"
    );


    let audioElement =
        document.getElementById(
            "shuttle-remote-audio"
        );


    if (!audioElement) {

        audioElement =
            document.createElement(
                "audio"
            );

        audioElement.id =
            "shuttle-remote-audio";

        audioElement.autoplay =
            true;

        audioElement.playsInline =
            true;

        document.body.appendChild(
            audioElement
        );

        console.log(
            "[WebRTC] Monitor Remote Audio Element 已建立"
        );
    }


    audioElement.srcObject =
        remoteStream;


    audioElement
        .play()
        .then(() => {

            console.log(
                "[WebRTC] Monitor Remote Audio 播放成功"
            );

        })
        .catch(error => {

            console.warn(
                "[WebRTC] Monitor Remote Audio 播放失敗:",
                error
            );

        });

}

// ========================================
// WebRTC - Caller
// ========================================

async function startShuttleWebRTCAsCaller(
    callId
) {

    console.log(
        "[WebRTC] Monitor 使用 ShuttleWebRTC 建立 Caller:",
        callId
    );


    if (
        !ShuttleMonitorWebSocket.isConnected()
    ) {

        console.warn(
            "[WebRTC] WebSocket 尚未連線"
        );

        return;
    }


    await ShuttleWebRTC.startAsCaller({

        webSocket:
            ShuttleMonitorWebSocket.getSocket(),

        callId,

        onRemoteStream:
            handleShuttleRemoteStream

    });

}

// ========================================
// Tracking
// ========================================

function handleShuttleLocationsUpdated(
    locations
) {

    shuttleLocations =
        Array.isArray(locations)
            ? locations
            : [];

    ShuttleMonitorMap.renderLocations(
        shuttleLocations
    );

    renderVehiclePanel();

    renderCommunicationPanel();

}

// ========================================
// Vehicle / GPS Status
// ========================================

function renderVehiclePanel() {

    const vehicleList =
        document.querySelector(
            ".shuttle-vehicle-list"
        );

    if (!vehicleList) {
        return;
    }


    const drivers =
        shuttleLocations.filter(
            driver =>
                Number(driver.role_id) === 4
        );


    if (drivers.length === 0) {

        vehicleList.innerHTML = `

            <div class="communication-empty">

                <div class="communication-empty-title">
                    目前沒有路線駕駛
                </div>

                <div class="communication-empty-text">
                    尚未取得駕駛資料
                </div>

            </div>

        `;

        return;
    }


    vehicleList.innerHTML =
        drivers.map(
            driver => {

                const personnelName =
                    driver.personnel_name ||
                    driver.username ||
                    "未設定姓名";

                const personnelNumber =
                    driver.personnel_number ||
                    "未設定編號";

                const gpsStatus =
                    driver.gps_status ||
                    "NO_LOCATION";


                let statusText =
                    "尚未定位";


                if (gpsStatus === "ONLINE") {

                    statusText =
                        "ONLINE";

                } else if (
                    gpsStatus === "OFFLINE"
                ) {

                    statusText =
                        "OFFLINE";

                }


                return `

                    <div class="communication-item">

                        <div class="communication-person">

                            <div
                                class="communication-status-dot ${gpsStatus.toLowerCase()}"
                            ></div>

                            <div class="communication-person-info">

                                <div class="communication-person-name">
                                    ${escapeHtml(personnelName)}
                                </div>

                                <div class="communication-person-number">
                                    ${escapeHtml(personnelNumber)}
                                </div>

                                <div class="communication-person-context">
                                    GPS：${escapeHtml(statusText)}
                                </div>

                            </div>

                        </div>

                    </div>

                `;

            }
        ).join("");
}

// ========================================
// Communication
// ========================================

function getOnlineDrivers() {

    return shuttleOnlineUsers.filter(
        user =>
            Number(user.role_id) === 4 &&
            user.user_id &&
            user.access_context
    );
}


// ========================================
// Render Communication Panel
// ========================================

function renderCommunicationPanel() {

    const communicationList =
        document.querySelector(
            ".communication-list"
        );


    /*
     * 如果目前沒有開啟「通訊」面板，
     * 不需要立即操作畫面。
     *
     * 下一次開啟面板時，
     * openBottomPanel() 會使用最新資料。
     */

    if (!communicationList) {

        return;
    }


    const drivers =
        getOnlineDrivers();


    if (drivers.length === 0) {

        communicationList.innerHTML = `

            <div class="communication-empty">

                <div class="communication-empty-title">
                    目前沒有在線駕駛
                </div>

                <div class="communication-empty-text">
                    等待駕駛登入接駁車勤務
                </div>

            </div>

        `;

        return;
    }


    communicationList.innerHTML =
        drivers.map(
            driver => {

                const personnelName =
                    driver.personnel_name ||
                    driver.username ||
                    "未設定姓名";

                const personnelNumber =
                    driver.personnel_number ||
                    "未設定編號";

                const accessContext =
                    driver.access_context ||
                    "未設定勤務區域";

                const userId =
                    driver.user_id || "";

                return `

                    <div
                        class="communication-item"
                        data-user-id="${escapeHtml(userId)}"
                    >

                        <div class="communication-person">

                            <div class="communication-status-dot"></div>

                            <div class="communication-person-info">

                                <div class="communication-person-name">
                                    ${escapeHtml(personnelName)}
                                </div>

                                <div class="communication-person-number">
                                    ${escapeHtml(personnelNumber)}
                                </div>

                                <div class="communication-person-context">
                                    ${escapeHtml(accessContext)}
                                </div>

                            </div>

                        </div>


                        <button
                            type="button"
                            class="communication-call-button"
                            data-user-id="${escapeHtml(userId)}"
                        >
                            呼叫
                        </button>

                    </div>

                `;

            }
        ).join("");


    bindCommunicationCallButtons();
}

// ========================================
// Call Window
// ========================================

function createCallWindow() {

    if (
        document.getElementById(
            "shuttle-call-window"
        )
    ) {

        return;
    }


    const callWindow =
        document.createElement(
            "div"
        );

    callWindow.id =
        "shuttle-call-window";

    callWindow.className =
        "shuttle-call-window hidden";


    callWindow.innerHTML = `

        <div class="shuttle-call-card">

            <div class="shuttle-call-icon">
                📞
            </div>

            <div
                id="shuttle-call-state"
                class="shuttle-call-state"
            >
                呼叫中
            </div>

            <div
                id="shuttle-call-name"
                class="shuttle-call-name"
            >
                --
            </div>

            <div
                id="shuttle-call-number"
                class="shuttle-call-number"
            >
                --
            </div>

            <div
                id="shuttle-call-route"
                class="shuttle-call-route"
            >
                --
            </div>

            <div
                id="shuttle-call-status"
                class="shuttle-call-status"
            >
                等待對方接聽...
            </div>

            <div
                id="shuttle-call-timer"
                class="shuttle-call-timer"
            >
                00:00
            </div>

            <button
                id="shuttle-call-hangup"
                type="button"
                class="shuttle-call-hangup"
            >
                掛斷
            </button>

        </div>

    `;


    document.body.appendChild(
        callWindow
    );


    const hangupButton =
        document.getElementById(
            "shuttle-call-hangup"
        );


    if (hangupButton) {

        hangupButton.addEventListener(
            "click",
            hangupActiveCall
        );

    }

}

function updateCallWindow() {

    createCallWindow();

    const callState =
        ShuttleCall.getState();

    const callWindow =
        document.getElementById(
            "shuttle-call-window"
        );


    const stateElement =
        document.getElementById(
            "shuttle-call-state"
        );


    const nameElement =
        document.getElementById(
            "shuttle-call-name"
        );


    const numberElement =
        document.getElementById(
            "shuttle-call-number"
        );


    const routeElement =
        document.getElementById(
            "shuttle-call-route"
        );


    const statusElement =
        document.getElementById(
            "shuttle-call-status"
        );


    const timerElement =
        document.getElementById(
            "shuttle-call-timer"
        );


    if (!callWindow) {
        return;
    }


    const target =
        callState.activeCallTarget || {};


    if (nameElement) {

        nameElement.textContent =
            target.personnel_name ||
            target.username ||
            "未知駕駛";
    }


    if (numberElement) {

        numberElement.textContent =
            target.personnel_number ||
            "--";
    }


    if (routeElement) {

        routeElement.textContent =
            target.access_context ||
            "未知路線";
    }


    if (
        callState.activeCallState ===
        "CALLING"
    ) {

        if (stateElement) {
            stateElement.textContent =
                "呼叫中";
        }

        if (statusElement) {
            statusElement.textContent =
                "等待對方接聽...";
        }

        if (timerElement) {
            timerElement.textContent =
                "00:00";
        }

    }


    if (
        callState.activeCallState ===
        "CONNECTED"
    ) {

        if (stateElement) {
            stateElement.textContent =
                "通話中";
        }

        if (statusElement) {
            statusElement.textContent =
                "語音通話已建立";
        }

    }


    callWindow.classList.remove(
        "hidden"
    );
}

function hangupActiveCall() {

    const callState =
        ShuttleCall.getState();

    if (!callState.activeCallId) {

        return;
    }


    if (!ShuttleMonitorWebSocket.isConnected()) {

        console.warn(
            "[Shuttle Communication] WebSocket 未連線"
        );

        return;
    }


    console.log(
        "[Shuttle Communication] 掛斷:",
        callState.activeCallId
    );


    ShuttleMonitorWebSocket.send({

        type:
            "call:hangup",

        call_id:
            callState.activeCallId

    });


    closeCallWindow();
}

function closeCallWindow() {

    ShuttleCall.clearCall();

    ShuttleWebRTC.cleanup();

    const callWindow =
        document.getElementById(
            "shuttle-call-window"
        );

    if (callWindow) {
        callWindow.classList.add(
            "hidden"
        );
    }
}

// ========================================
// Escape HTML
// ========================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ========================================
// Communication Call Buttons
// ========================================

function bindCommunicationCallButtons() {

    document
        .querySelectorAll(
            ".communication-call-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    const targetUserId =
                        button.dataset.userId;

                    console.log(
                        "[Shuttle Communication] 發起呼叫:",
                        targetUserId
                    );

                    const targetDriver =
                        getOnlineDrivers().find(
                            driver =>
                                String(driver.user_id) ===
                                String(targetUserId)
                        );


                    if (!targetDriver) {

                        console.warn(
                            "[Shuttle Communication] 找不到目標駕駛:",
                            targetUserId
                        );

                        return;
                    }

                    ShuttleCall.setCall({
                        callId: null,
                        target: targetDriver,
                        state: "CALLING"
                    });

                    updateCallWindow();

                    /*
                     * 確認 WebSocket
                     */

                    if (!ShuttleMonitorWebSocket.isConnected()) {

                        console.warn(
                            "[Shuttle Communication] WebSocket 尚未連線"
                        );

                        return;
                    }


                    /*
                     * 發送通話請求
                     */

                    ShuttleMonitorWebSocket.send({
                        type: "call",
                        target_user_id: targetUserId
                    });


                    console.log(
                        "[Shuttle Communication] call 已送出:",
                        targetUserId
                    );

                }
            );

        });
}

// ========================================
// Bottom UI
// ========================================

let activeBottomPanel = null;

const bottomUI =
    document.getElementById(
        "bottom-ui"
    );

const bottomSheet =
    document.getElementById(
        "bottom-sheet"
    );

const bottomSheetContent =
    document.getElementById(
        "bottom-sheet-content"
    );

const bottomNavigation =
    document.getElementById(
        "bottom-navigation"
    );

// ========================================
// Bottom Panel Content
// ========================================

const bottomPanelContents = {

    vehicles: {

        title: "車輛",

        html: `

            <div class="bottom-panel-header">

                <div>

                    <div class="bottom-panel-title">
                        車輛
                    </div>

                    <div class="bottom-panel-subtitle">
                        路線車輛
                    </div>

                </div>

                <div class="bottom-panel-status">
                    GPS
                </div>

            </div>


            <div class="shuttle-vehicle-list">

                <div class="communication-empty">

                    <div class="communication-empty-title">
                        正在取得車輛資料
                    </div>

                    <div class="communication-empty-text">
                        GPS 定位資料載入中
                    </div>

                </div>

            </div>

        `

    },


    monitoring: {

        title: "監控",

        html: `

            <div class="bottom-panel-empty">

                <div class="bottom-panel-empty-title">
                    監控
                </div>

                <div class="bottom-panel-empty-text">
                    監控資訊將顯示於此
                </div>

            </div>

        `

    },


    communication: {

        title: "通訊",

        html: `

            <div class="bottom-panel-header">

                <div>

                    <div class="bottom-panel-title">
                        通訊
                    </div>

                    <div class="bottom-panel-subtitle">
                        線上駕駛
                    </div>

                </div>

                <div class="bottom-panel-status">
                    ONLINE
                </div>

            </div>


            <div class="communication-list">

                <div class="communication-empty">

                    <div class="communication-empty-title">
                        正在取得在線駕駛
                    </div>

                    <div class="communication-empty-text">
                        WebSocket 連線中
                    </div>

                </div>

            </div>

        `

    },


    other: {

        title: "其他",

        html: `

        <div class="bottom-panel-header">

            <div>

                <div class="bottom-panel-title">
                    其他
                </div>

                <div class="bottom-panel-subtitle">
                    地圖顯示設定
                </div>

            </div>

        </div>


        <div class="map-display-settings">

            <div class="bottom-panel-empty">

                <div class="bottom-panel-empty-title">
                    駕駛顯示
                </div>

                <div class="bottom-panel-empty-text">
                    選擇地圖上的駕駛顯示範圍
                </div>

            </div>


            <button
                type="button"
                class="map-display-option"
                data-map-display-mode="all"
            >

                <span class="map-display-option-radio"></span>

                <span class="map-display-option-content">

                    <span class="map-display-option-title">
                        全部駕駛
                    </span>

                    <span class="map-display-option-text">
                        顯示在線與離線駕駛
                    </span>

                </span>

            </button>


            <button
                type="button"
                class="map-display-option"
                data-map-display-mode="online"
            >

                <span class="map-display-option-radio"></span>

                <span class="map-display-option-content">

                    <span class="map-display-option-title">
                        僅在線駕駛
                    </span>

                    <span class="map-display-option-text">
                        只顯示目前 GPS 在線駕駛
                    </span>

                </span>

            </button>

        </div>

    `

    }

};

// ========================================
// Map Display Settings
// ========================================

function bindMapDisplaySettings() {

    const options =
        document.querySelectorAll(
            ".map-display-option"
        );


    options.forEach(option => {

        option.addEventListener(
            "click",
            () => {

                const mode =
                    option.dataset.mapDisplayMode;


                if (
                    mode !== "all" &&
                    mode !== "online"
                ) {

                    return;
                }


                ShuttleMonitorMap.setDisplayMode(
                    mode
                );


                updateMapDisplaySettings();


                ShuttleMonitorMap.renderLocations(
                    shuttleLocations
                );

            }
        );

    });


    updateMapDisplaySettings();
}


// ========================================
// Update Map Display Settings UI
// ========================================

function updateMapDisplaySettings() {

    const options =
        document.querySelectorAll(
            ".map-display-option"
        );


    options.forEach(option => {

        const mode =
            option.dataset.mapDisplayMode;


        const isActive =
            mode ===
            ShuttleMonitorMap.getDisplayMode();


        option.classList.toggle(
            "active",
            isActive
        );

    });

}

// ========================================
// Open Bottom Panel
// ========================================

function openBottomPanel(panelName) {

    const panel =
        bottomPanelContents[panelName];


    if (!panel) {

        return;
    }


    if (
        activeBottomPanel ===
        panelName
    ) {

        closeBottomPanel();

        return;
    }


    activeBottomPanel =
        panelName;


    bottomSheetContent.innerHTML =
        panel.html;


    bottomUI.classList.add(
        "expanded"
    );


    document
        .querySelectorAll(
            ".bottom-nav-item"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.panel ===
                panelName
            );

        });


    // ========================================
    // Panel Refresh
    // ========================================

    if (
        panelName ===
        "vehicles"
    ) {

        renderVehiclePanel();

    }


    if (
        panelName ===
        "communication"
    ) {

        renderCommunicationPanel();

    }

    if (
        panelName ===
        "other"
    ) {

        bindMapDisplaySettings();

    }

}

// ========================================
// Close Bottom Panel
// ========================================

function closeBottomPanel() {

    activeBottomPanel =
        null;


    bottomUI.classList.remove(
        "expanded"
    );


    document
        .querySelectorAll(
            ".bottom-nav-item"
        )
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });

}


// ========================================
// Bottom Navigation Events
// ========================================

if (bottomNavigation) {

    bottomNavigation
        .querySelectorAll(
            ".bottom-nav-item"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    const panelName =
                        button.dataset.panel;

                    openBottomPanel(
                        panelName
                    );

                }
            );

        });

}


// ========================================
// Click Map → Close Bottom Panel
// ========================================

const mapSection =
    document.querySelector(
        ".map-section"
    );

if (mapSection) {

    mapSection.addEventListener(
        "click",
        () => {

            if (activeBottomPanel) {

                closeBottomPanel();

            }

        }
    );

}


// ========================================
// Prevent Bottom Sheet Click
// from Closing Itself
// ========================================

if (bottomSheet) {

    bottomSheet.addEventListener(
        "click",
        event => {

            event.stopPropagation();

        }
    );

}


// ========================================
// Start
// ========================================

async function waitForGoogleMaps() {

    if (
        window.google &&
        google.maps &&
        google.maps.importLibrary
    ) {

        await ShuttleMonitorMap.init();

        ShuttleMonitorTracking.configure({
            api: SHUTTLE_LOCATION_API,
            interval: SHUTTLE_REFRESH_INTERVAL,
            locationsHandler:
                handleShuttleLocationsUpdated
        });

        ShuttleMonitorTracking.start();

        return;
    }

    setTimeout(
        waitForGoogleMaps,
        100
    );
}

waitForGoogleMaps();

connectShuttleWebSocket();


// ========================================
// Cleanup
// ========================================

window.addEventListener(
    "beforeunload",
    () => {

        ShuttleMonitorTracking.cleanup();

        ShuttleMonitorWebSocket.close();

    }
);


// ========================================
// Logout
// ========================================

const logoutButton =
    document.getElementById(
        "logout-btn"
    );

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            ShuttleMonitorTracking.cleanup();

            ShuttleMonitorWebSocket.close();

            await logout();

            window.location.href =
                "../index.html";

        }
    );

}