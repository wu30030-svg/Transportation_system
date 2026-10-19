console.log("[Shuttle Driver] Driver UI 啟動");

console.log(
    "[Shuttle Driver] 定位執行環境",
    typeof window.AndroidShuttleBridge !== "undefined"
        ? "Android 原生 GPS"
        : "瀏覽器 GPS"
);

let shuttleDriverUser = null;
let shuttleDriverRoute = null;
let shuttleOnlineUsers = [];

/**
 * ========================================
 * Driver Identity
 * 依登入帳號取得駕駛、車輛顯示名稱及路線
 * ========================================
 */

async function loadShuttleDriverIdentity() {
    const vehicleElement = document.getElementById(
        "driver-vehicle-name"
    );

    const personnelElement = document.getElementById(
        "driver-personnel-name"
    );

    const routeElement = document.getElementById(
        "driver-route-name"
    );

    try {
        const token = getAuthToken();

        if (!token) {
            throw new Error("登入憑證不存在");
        }

        const response = await fetch(
            `${CONFIG.API_BASE_URL}/api/auth/me`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `取得登入資料失敗：HTTP ${response.status}`
            );
        }

        const result = await response.json();

        // 相容常見的 API 回傳結構
        const user =
            result.user ||
            result.data?.user ||
            result.data ||
            result;

        const personnelNumber =
            user.personnel_number || "";

        const personnelName =
            user.personnel_name ||
            user.name ||
            user.username ||
            "未設定駕駛姓名";

        const accessContext =
            user.access_context || "";
        shuttleDriverUser = user;
        shuttleDriverRoute = accessContext;

        if (!personnelNumber) {
            throw new Error(
                "登入帳號沒有 personnel_number，無法與監控地圖對應"
            );
        }

        // 與監控端 getShuttleDisplayName() 使用相同的編號規則
        const numberMatch = personnelNumber.match(
            /^SHUTTLE-(\d{3})$/i
        );

        let vehicleName = personnelNumber;

        if (numberMatch) {
            const number = Number(numberMatch[1]);

            if (number >= 1 && number <= 10) {
                vehicleName = `成功線 ${number}`;
            } else if (number >= 11 && number <= 60) {
                vehicleName = `新烏日線 ${number - 10}`;
            } else if (number >= 61 && number <= 110) {
                vehicleName = `水湳線 ${number - 60}`;
            } else if (number >= 111 && number <= 125) {
                vehicleName = `嶺東科大線 ${number - 110}`;
            } else if (number >= 126 && number <= 135) {
                vehicleName = `營內1號門接駁線 ${number - 125}`;
            } else if (number >= 136 && number <= 141) {
                vehicleName = `復康巴士 ${number - 135}`;
            } else if (number >= 142 && number <= 152) {
                vehicleName = `待命車輛 ${number - 141}`;
            }
        }

        // 將後端路線代碼轉為駕駛端顯示文字
        let routeName = "尚未設定路線";

        const routeMatch = accessContext.match(
            /營區開放_([A-E])路線/
        );

        if (routeMatch) {
            routeName = `${routeMatch[1]} 路線`;
        } else if (accessContext) {
            routeName = accessContext;
        }

        if (vehicleElement) {
            vehicleElement.textContent = vehicleName;
        }

        if (personnelElement) {
            personnelElement.textContent = personnelName;
        }

        if (routeElement) {
            routeElement.textContent = routeName;
        }

        console.log("[Shuttle Driver] 身分資料已載入", {
            personnelNumber,
            vehicleName,
            personnelName,
            routeName
        });

    } catch (error) {
        console.error(
            "[Shuttle Driver] 載入身分資料失敗：",
            error
        );

        if (vehicleElement) {
            vehicleElement.textContent = "無法取得車輛資料";
        }

        if (personnelElement) {
            personnelElement.textContent = "無法取得駕駛資料";
        }

        if (routeElement) {
            routeElement.textContent = "無法取得路線資料";
        }
    }
}

// 載入身分不應阻止 GPS 啟動
loadShuttleDriverIdentity();

// ========================================
// DOM
// ========================================

const gpsStatusElement =
    document.getElementById(
        "shuttle-gps-monitor-status"
    );

const gpsStateElement =
    document.getElementById(
        "gpsState"
    );

const lastUpdateElement =
    document.getElementById(
        "lastUpdate"
    );

const accuracyElement =
    document.getElementById(
        "accuracy"
    );

const sendingDotElement =
    document.getElementById(
        "sendingDot"
    );

const sendingTitleElement =
    document.getElementById(
        "sendingTitle"
    );

const sendingDescriptionElement =
    document.getElementById(
        "sendingDescription"
    );


// ========================================================
// GPS / Monitor Status UI
// ========================================================

function updateDriverGPSStatus(data) {

    const status =
        data.status;


    // ====================================================
    // STARTING
    // ====================================================

    if (
        status ===
        "STARTING"
    ) {

        setGPSStatusUI(
            "starting",
            "🟡 正在取得 GPS",
            "正在等待手機定位"
        );

        setGPSState(
            "啟動中"
        );

        setSendingStatus(
            "確認中",
            "正在等待 GPS 定位資料"
        );

        return;
    }


    // ====================================================
    // GPS_UNAVAILABLE
    // ====================================================

    if (
        status ===
        "GPS_UNAVAILABLE"
    ) {

        setGPSStatusUI(
            "offline",
            "🔴 GPS 未啟用",
            "請開啟手機定位權限"
        );

        setGPSState(
            "未啟用"
        );

        setSendingStatus(
            "無法傳送定位",
            "請開啟手機定位與網路"
        );

        return;
    }


    // ====================================================
    // GPS_ERROR
    // ====================================================

    if (
        status ===
        "GPS_ERROR"
    ) {

        setGPSStatusUI(
            "offline",
            "🔴 GPS 定位異常",
            "請確認手機定位功能已開啟"
        );

        setGPSState(
            "定位異常"
        );

        setSendingStatus(
            "定位異常",
            "目前無法取得新的 GPS 資料"
        );

        return;
    }


    // ====================================================
    // GPS_RECEIVED / WAITING_UPLOAD
    // ====================================================

    if (
        status === "GPS_RECEIVED" ||
        status === "WAITING_UPLOAD"
    ) {

        setGPSStatusUI(
            "warning",
            "🟡 GPS 已取得",
            "正在傳送定位至監控中心"
        );

        setGPSState(
            "已取得"
        );

        setSendingStatus(
            "正在傳送定位",
            "正在等待監控中心確認"
        );

        return;
    }


    // ====================================================
    // UPLOAD_ERROR
    // ====================================================

    if (
        status ===
        "UPLOAD_ERROR"
    ) {

        const lastSuccessText =
            data.lastUploadSuccessAt
                ? new Date(
                    data.lastUploadSuccessAt
                ).toLocaleTimeString(
                    "zh-TW",
                    {
                        hour12: false
                    }
                )
                : "尚無成功紀錄";


        setGPSStatusUI(
            "warning",
            "🟡 定位傳送異常",
            "監控中心尚未收到最新定位"
        );

        setGPSState(
            "傳送異常"
        );

        setSendingStatus(
            "定位傳送異常",
            `最後成功：${lastSuccessText}`
        );

        return;
    }


    // ====================================================
    // DELAYED
    // ====================================================

    if (
        status ===
        "DELAYED"
    ) {

        const seconds =
            data.secondsSinceUpload ?? 0;


        setGPSStatusUI(
            "warning",
            "🟡 監控定位更新延遲",
            `已 ${seconds} 秒未成功送出新定位`
        );

        setGPSState(
            "更新延遲"
        );

        setSendingStatus(
            "定位更新延遲",
            "請保持接駁車中心開啟"
        );

        return;
    }


    // ====================================================
    // OFFLINE
    // ====================================================

    if (
        status ===
        "OFFLINE"
    ) {

        const seconds =
            data.secondsSinceUpload ?? 0;


        const lastSuccessText =
            data.lastUploadSuccessAt
                ? new Date(
                    data.lastUploadSuccessAt
                ).toLocaleTimeString(
                    "zh-TW",
                    {
                        hour12: false
                    }
                )
                : "尚無成功紀錄";


        setGPSStatusUI(
            "offline",
            "🔴 監控定位已中斷",
            `已 ${seconds} 秒未收到新的定位`
        );

        setGPSState(
            "已中斷"
        );

        setSendingStatus(
            "定位傳送已中斷",
            `最後成功送出：${lastSuccessText}`
        );

        return;
    }


    // ====================================================
    // ONLINE
    // ====================================================

    if (
        status ===
        "ONLINE"
    ) {

        const lastSuccessText =
            data.lastUploadSuccessAt
                ? new Date(
                    data.lastUploadSuccessAt
                ).toLocaleTimeString(
                    "zh-TW",
                    {
                        hour12: false
                    }
                )
                : "--";


        setGPSStatusUI(
            "online",
            "🟢 監控中心已收到定位",
            "定位資料傳送正常"
        );

        setGPSState(
            "已連線"
        );

        setSendingStatus(
            "定位傳送正常",
            `最後成功：${lastSuccessText}`
        );

        return;
    }


    // ====================================================
    // RESTARTING
    // ====================================================

    if (
        status ===
        "RESTARTING"
    ) {

        setGPSStatusUI(
            "starting",
            "🟡 正在重新取得 GPS",
            "頁面重新啟動定位服務"
        );

        setGPSState(
            "重新啟動"
        );

        setSendingStatus(
            "重新取得定位",
            "正在重新連線 GPS"
        );

        return;
    }
}

/**
 * Android 原生 GPS 狀態接收入口
 * 由 MainActivity 透過 WebView.evaluateJavascript 呼叫
 */
window.handleNativeShuttleGPSStatus = function (data) {
    if (!data || typeof data.status !== "string") {
        console.warn("[Native GPS] 收到無效狀態", data);
        return;
    }

    console.log("[Native GPS] 狀態更新", data);

    // 更新現有 GPS 狀態卡片
    updateDriverGPSStatus(data);

    // 更新精度
    if (
        typeof data.accuracy === "number" &&
        accuracyElement
    ) {
        accuracyElement.textContent =
            `${data.accuracy.toFixed(1)} m`;
    }

    // 更新最近一次定位時間
    if (
        data.status === "ONLINE" &&
        lastUpdateElement
    ) {
        lastUpdateElement.textContent =
            new Date(
                data.lastUploadSuccessAt || Date.now()
            ).toLocaleTimeString("zh-TW", {
                hour12: false
            });
    }

    // 更新手動重新發送定位按鈕的結果
    const message =
        document.getElementById("gps-resend-message");

    if (message && data.isManualRequest === true) {
        if (data.status === "ONLINE") {
            message.className =
                "gps-resend-message success";

            message.textContent =
                "定位已成功送出。";
        } else if (
            data.status === "UPLOAD_ERROR" ||
            data.status === "GPS_ERROR" ||
            data.status === "GPS_UNAVAILABLE"
        ) {
            message.className =
                "gps-resend-message error";

            message.textContent =
                data.message || "定位傳送失敗，請稍後再試。";
        }
    }
};
console.log(
    "[Native GPS] 回呼定義完成：",
    typeof window.handleNativeShuttleGPSStatus
);

// ========================================================
// GPS Status Card
// ========================================================

function setGPSStatusUI(
    className,
    title,
    description
) {

    if (!gpsStatusElement) {
        return;
    }


    gpsStatusElement.className =
        `shuttle-gps-monitor-status ${className}`;


    gpsStatusElement.innerHTML = `

        <div class="gps-monitor-title">
            ${title}
        </div>

        <div class="gps-monitor-detail">
            ${description}
        </div>

    `;
}


// ========================================================
// GPS State
// ========================================================

function setGPSState(
    state
) {

    if (!gpsStateElement) {
        return;
    }

    gpsStateElement.textContent =
        state;
}


// ========================================================
// Sending Status
// ========================================================

function setSendingStatus(
    title,
    description
) {

    if (sendingTitleElement) {

        sendingTitleElement.textContent =
            title;
    }


    if (sendingDescriptionElement) {

        sendingDescriptionElement.textContent =
            description;
    }


    if (sendingDotElement) {

        sendingDotElement.className =
            "sending-dot";
    }
}

// ========================================================
// Manual GPS Retry Button
// 3 秒冷卻，避免駕駛連續點擊
// ========================================================

(function initManualGPSButton() {

    const button =
        document.getElementById("gps-resend-btn");

    const message =
        document.getElementById("gps-resend-message");

    if (!button || !message) {
        return;
    }

    let coolingDown = false;
    let requestInProgress = false;

    button.addEventListener("click", async () => {

        if (coolingDown || requestInProgress) {
            return;
        }

        coolingDown = true;
        requestInProgress = true;
        button.disabled = true;

        message.className = "gps-resend-message";
        message.textContent = "正在重新取得 GPS 並傳送定位…";

        // 3 秒後允許再次點擊；
        // 若定位請求仍在執行，仍會由 requestInProgress 阻擋。
        setTimeout(() => {
            coolingDown = false;

            if (!requestInProgress) {
                button.disabled = false;
                button.textContent = "↻ 重新發送定位";
            }
        }, 3000);

        button.textContent = "正在取得定位…";


        try {
            if (isNativeShuttleApp) {
                const token = getAuthToken();

                if (!token) {
                    throw new Error("登入憑證不存在，請重新登入");
                }

                window.AndroidShuttleBridge.requestLocationNow(token);

                message.className = "gps-resend-message";
                message.textContent =
                    "已要求 Android 重新取得定位，等待上傳結果。";

            } else {
                const success = await ShuttleGPS.requestLocationNow();

                if (success !== true) {
                    throw new Error("定位上傳失敗，請稍後重試");
                }

                message.className = "gps-resend-message success";
                message.textContent =
                    `定位已成功送出（${new Date().toLocaleTimeString("zh-TW", {
                        hour12: false
                    })}）`;
            }

        } catch (error) {
            console.warn(
                "[Shuttle Driver] 手動重新發送定位失敗:",
                error
            );

            message.className = "gps-resend-message error";
            message.textContent =
                error.message || "定位傳送失敗，請稍後再試";

        } finally {
            requestInProgress = false;

            if (!coolingDown) {
                button.disabled = false;
                button.textContent = "↻ 重新發送定位";
            }
        }

    });

})();

// ========================================================
// GPS Init
// ========================================================

const isNativeShuttleApp =
    typeof window.AndroidShuttleBridge !== "undefined";

if (!isNativeShuttleApp) {
    ShuttleGPS.init({
        lastUpdateElement,
        accuracyElement,
        statusHandler: updateDriverGPSStatus
    });
}

// ========================================
// API
// ========================================

const SHUTTLE_LOCATION_API =
    `${CONFIG.API_BASE_URL}/api/tracking/shuttle/location`;

// ========================================
// WebSocket State
// ========================================

let shuttleWebSocket = null;

// ========================================
// Shuttle WebSocket
// ========================================

function connectShuttleWebSocket() {

    const token =
        getAuthToken();


    if (!token) {

        console.error(
            "[Shuttle WebSocket] 沒有登入 Token"
        );

        return;
    }


    if (
        shuttleWebSocket &&
        (
            shuttleWebSocket.readyState ===
            WebSocket.OPEN ||

            shuttleWebSocket.readyState ===
            WebSocket.CONNECTING
        )
    ) {

        console.log(
            "[Shuttle WebSocket] 已存在連線"
        );

        return;
    }


    const wsBaseUrl =
        CONFIG.API_BASE_URL.replace(
            /^http/,
            "ws"
        );


    const wsUrl =
        `${wsBaseUrl}/ws`;


    console.log(
        "[Shuttle WebSocket] Connecting:",
        wsUrl
    );


    shuttleWebSocket =
        new WebSocket(wsUrl);


    // ========================================
    // WebSocket Connected
    // ========================================

    shuttleWebSocket.addEventListener(
        "open",
        () => {

            console.log(
                "[Shuttle WebSocket] Connected"
            );


            shuttleWebSocket.send(
                JSON.stringify({
                    type:
                        "auth",

                    token:
                        token
                })
            );
        }
    );


    // ========================================
    // WebSocket Message
    // ========================================

    shuttleWebSocket.addEventListener(
        "message",
        event => {

            try {

                const data =
                    JSON.parse(
                        event.data
                    );


                console.log(
                    "[Shuttle WebSocket] <= ",
                    data
                );


                handleShuttleWebSocketMessage(
                    data
                );


            } catch (error) {

                console.error(
                    "[Shuttle WebSocket] 訊息解析失敗:",
                    error
                );
            }
        }
    );


    // ========================================
    // WebSocket Error
    // ========================================

    shuttleWebSocket.addEventListener(
        "error",
        error => {

            console.error(
                "[Shuttle WebSocket] Error:",
                error
            );
        }
    );


    // ========================================
    // WebSocket Close
    // ========================================

    shuttleWebSocket.addEventListener(
        "close",
        () => {

            console.log(
                "[Shuttle WebSocket] Closed"
            );


            shuttleWebSocket =
                null;
        }
    );
}

// ========================================
// WebSocket Message Handler
// ========================================

async function handleShuttleWebSocketMessage(data) {
    // Authentication Success
    if (data.type === "auth:success") {
        console.log(
            "[Shuttle WebSocket] Authentication success:",
            data.user
        );

        if (
            shuttleWebSocket &&
            shuttleWebSocket.readyState === WebSocket.OPEN
        ) {
            shuttleWebSocket.send(JSON.stringify({
                type: "online:list"
            }));
        }

        return;
    }

    // Online User List
    if (data.type === "online:list") {
        shuttleOnlineUsers = Array.isArray(data.users)
            ? data.users
            : [];

        console.log(
            "[Shuttle WebSocket] Online users:",
            shuttleOnlineUsers
        );

        return;
    }

    // Outgoing Call Started
    if (data.type === "call:started") {
        const callState = ShuttleCall.getState();

        if (callState.activeCallState !== "CALLING") {
            console.warn("[Call] 目前沒有等待中的主動呼叫");
            return;
        }

        if (!data.call_id) {
            console.error("[Call] 伺服器沒有回傳 call_id");
            closeCallWindow();
            return;
        }

        ShuttleCall.setCall({
            callId: data.call_id,
            target: callState.activeCallTarget,
            state: "CALLING"
        });

        updateCallWindow();
        return;
    }

    // Incoming Call
    if (data.type === "call:incoming") {
        console.log("[Call] 收到來電:", data);

        // 已有通話時不覆蓋目前通話
        if (ShuttleCall.getState().activeCallState) {
            console.warn("[Call] 已有通話，忽略新的來電");
            return;
        }

        ShuttleCall.setCall({
            callId: data.call_id,
            target: data.caller || {},
            state: "INCOMING"
        });

        updateCallWindow();
        return;
    }

    // WebRTC Offer
    if (data.type === "call:webrtc-offer") {
        await handleShuttleWebRTCOffer(data);
        return;
    }

    // WebRTC ICE
    if (data.type === "call:webrtc-ice") {
        const callState = ShuttleCall.getState();

        if (data.call_id !== callState.activeCallId) {
            console.warn("[WebRTC] ICE 不屬於目前通話:", data.call_id);
            return;
        }

        if (!data.candidate) {
            console.warn("[WebRTC] ICE Candidate 資料不存在");
            return;
        }

        try {
            await ShuttleWebRTC.handleIceCandidate(data.candidate);
        } catch (error) {
            console.error("[WebRTC] 處理 ICE 失敗:", error);
        }

        return;
    }

    // Call Accepted
    if (data.type === "call:accepted") {
        const callState = ShuttleCall.getState();

        if (data.call_id !== callState.activeCallId) {
            return;
        }

        // 接聽前先判斷本端是否為發起方
        const wasCalling = callState.activeCallState === "CALLING";

        ShuttleCall.setState("CONNECTED");

        if (!callState.callStartedAt) {
            ShuttleCall.setStarted();
        }

        updateCallWindow();
        ShuttleCall.startTimer();

        // 本端發起通話：收到接聽確認後建立 WebRTC Offer
        if (wasCalling) {
            try {
                await ShuttleWebRTC.startAsCaller({
                    webSocket: shuttleWebSocket,
                    callId: data.call_id,
                    onRemoteStream: handleDriverRemoteStream,
                    role: "driver"
                });
            } catch (error) {
                console.error("[WebRTC] 駕駛發起語音失敗:", error);
                closeCallWindow();
            }
        }

        return;
    }

    // Call Rejected
    if (data.type === "call:rejected") {
        const callState = ShuttleCall.getState();

        if (data.call_id === callState.activeCallId) {
            closeCallWindow();
        }

        return;
    }

    // Call Ended
    if (data.type === "call:ended") {
        const callState = ShuttleCall.getState();

        if (
            !callState.activeCallId ||
            data.call_id === callState.activeCallId
        ) {
            closeCallWindow();
        }

        return;
    }

    // Call Error
    if (data.type === "call:error") {
        console.warn("[Call] 通話錯誤:", data);
        closeCallWindow();
        return;
    }

    // Force Logout
    if (data.type === "auth:force-logout") {
        console.warn("[Shuttle WebSocket] 收到強制登出");

        if (isNativeShuttleApp) {
            window.AndroidShuttleBridge.stopTracking();
        } else {
            ShuttleGPS.stop();
        }

        if (shuttleWebSocket) {
            shuttleWebSocket.close();
            shuttleWebSocket = null;
        }

        closeCallWindow();

        if (typeof handleUnauthorized === "function") {
            handleUnauthorized();
        } else {
            window.location.href = "../index.html";
        }
    }


    // ========================================
    // Call Rejected
    // ========================================

    if (
        data.type ===
        "call:rejected"
    ) {

        console.log(
            "[Shuttle Communication] 通話被拒絕:",
            data
        );


        const callState =
            ShuttleCall.getState();

        if (
            data.call_id ===
            callState.activeCallId
        ) {
            closeCallWindow();
        }


        return;
    }


    // ========================================
    // Call Ended
    // ========================================

    if (
        data.type ===
        "call:ended"
    ) {

        console.log(
            "[Shuttle Communication] 對方已掛斷:",
            data
        );

        const callState =
            ShuttleCall.getState();

        if (
            !callState.activeCallId ||
            data.call_id ===
            callState.activeCallId
        ) {
            closeCallWindow();
        }

        return;
    }


    // ========================================
    // Call Error
    // ========================================

    if (
        data.type ===
        "call:error"
    ) {

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

    if (
        data.type ===
        "auth:force-logout"
    ) {

        console.warn(
            "[Shuttle WebSocket] 收到強制登出"
        );

        if (isNativeShuttleApp) {
            window.AndroidShuttleBridge.stopTracking();
        } else {
            ShuttleGPS.stop();
        }

        if (
            shuttleWebSocket
        ) {

            shuttleWebSocket.close();

            shuttleWebSocket =
                null;
        }


        closeCallWindow();


        if (
            typeof handleUnauthorized ===
            "function"
        ) {

            handleUnauthorized();

        } else {

            window.location.href =
                "../index.html";
        }


        return;
    }
}

// ========================================
// WebRTC - Driver Answer
// ========================================

async function handleShuttleWebRTCOffer(data) {

    const callId =
        data.call_id;

    const offer =
        data.offer;


    console.log(
        "[WebRTC] Driver 收到 Offer:",
        callId
    );


    if (
        !callId ||
        !offer
    ) {

        console.warn(
            "[WebRTC] Offer 資料不完整"
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
            "[WebRTC] Offer 不屬於目前通話:",
            callId
        );

        return;
    }


    try {

        await ShuttleWebRTC.handleOffer({
            webSocket:
                shuttleWebSocket,

            callId:
                callId,

            offer:
                offer,

            onRemoteStream:
                handleDriverRemoteStream
        });

    } catch (error) {

        console.error(
            "[WebRTC] Driver 處理 Offer 失敗:",
            error
        );

    }
}

// ========================================
// WebRTC - Driver Remote Audio
// ========================================

function handleDriverRemoteStream(stream) {
    console.log("[WebRTC] Driver 收到 Monitor Remote Audio Stream");
    ShuttleCallAudio.playRemoteStream(stream);
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
                來電
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
                --
            </div>


            <div
                id="shuttle-call-timer"
                class="shuttle-call-timer"
            >
                00:00
            </div>


            <div
                id="shuttle-call-actions"
                class="shuttle-call-actions"
            >

                <button
                    id="shuttle-call-reject"
                    type="button"
                    class="shuttle-call-button reject"
                >
                    拒絕
                </button>


                <button
                    id="shuttle-call-accept"
                    type="button"
                    class="shuttle-call-button accept"
                >
                    接聽
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        callWindow
    );


    const acceptButton =
        document.getElementById(
            "shuttle-call-accept"
        );


    const rejectButton =
        document.getElementById(
            "shuttle-call-reject"
        );


    if (acceptButton) {

        acceptButton.addEventListener(
            "click",
            acceptIncomingCall
        );

    }


    if (rejectButton) {

        rejectButton.addEventListener(
            "click",
            rejectIncomingCall
        );

    }
}


// ========================================
// Update Call Window
// ========================================

function updateCallWindow() {

    createCallWindow();


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


    const actionsElement =
        document.getElementById(
            "shuttle-call-actions"
        );


    if (!callWindow) {

        return;
    }


    const callState =
        ShuttleCall.getState();

    const target =
        callState.activeCallTarget || {};


    if (nameElement) {

        nameElement.textContent =
            target.personnel_name ||
            target.username ||
            "未知監控端";
    }


    if (numberElement) {

        numberElement.textContent =
            target.personnel_number ||
            target.username ||
            "--";
    }


    if (routeElement) {

        routeElement.textContent =
            target.access_context ||
            "未知路線";
    }


    // ========================================
    // Incoming
    // ========================================

    if (
        callState.activeCallState ===
        "INCOMING"
    ) {

        if (stateElement) {

            stateElement.textContent =
                "來電";

        }


        if (statusElement) {

            statusElement.textContent =
                "監控端正在呼叫您";

        }


        if (timerElement) {

            timerElement.textContent =
                "00:00";

        }


        if (actionsElement) {

            actionsElement.innerHTML = `

                <button
                    id="shuttle-call-reject"
                    type="button"
                    class="shuttle-call-button reject"
                >
                    拒絕
                </button>


                <button
                    id="shuttle-call-accept"
                    type="button"
                    class="shuttle-call-button accept"
                >
                    接聽
                </button>

            `;


            const acceptButton =
                document.getElementById(
                    "shuttle-call-accept"
                );


            const rejectButton =
                document.getElementById(
                    "shuttle-call-reject"
                );


            if (acceptButton) {

                acceptButton.addEventListener(
                    "click",
                    acceptIncomingCall
                );

            }


            if (rejectButton) {

                rejectButton.addEventListener(
                    "click",
                    rejectIncomingCall
                );

            }

        }

    }

    // ========================================
    // Outgoing Call
    // ========================================

    if (callState.activeCallState === "CALLING") {
        if (stateElement) {
            stateElement.textContent = "呼叫中";
        }

        if (statusElement) {
            statusElement.textContent = "正在呼叫同路線監控端，請稍候";
        }

        if (timerElement) {
            timerElement.textContent = "00:00";
        }

        if (actionsElement) {
            actionsElement.innerHTML = `
            <button
                id="shuttle-call-hangup"
                type="button"
                class="shuttle-call-button hangup"
                ${callState.activeCallId ? "" : "disabled"}
            >
                取消呼叫
            </button>
        `;

            const hangupButton =
                document.getElementById("shuttle-call-hangup");

            if (hangupButton) {
                hangupButton.addEventListener("click", () => {
                    hangupActiveCall();
                });
            }
        }
    }
    // ========================================
    // Connected
    // ========================================

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


        if (actionsElement) {

            actionsElement.innerHTML = `

                <button
                    id="shuttle-call-hangup"
                    type="button"
                    class="shuttle-call-button hangup"
                >
                    掛斷
                </button>

            `;


            const hangupButton =
                document.getElementById(
                    "shuttle-call-hangup"
                );


            if (hangupButton) {

                hangupButton.addEventListener(
                    "click",
                    () => {

                        hangupActiveCall();

                    }
                );

            }

        }

    }


    callWindow.classList.remove(
        "hidden"
    );
}

// ========================================
// Accept Call
// ========================================

function acceptIncomingCall() {

    const callState =
        ShuttleCall.getState();

    if (!callState.activeCallId) {

        console.warn(
            "[Shuttle Communication] 沒有可接聽的來電"
        );

        return;
    }


    if (
        !shuttleWebSocket ||
        shuttleWebSocket.readyState !==
        WebSocket.OPEN
    ) {

        console.error(
            "[Shuttle Communication] WebSocket 未連線"
        );

        return;
    }


    console.log(
        "[Shuttle Communication] 接聽:",
        callState.activeCallId
    );


    shuttleWebSocket.send(
        JSON.stringify({

            type:
                "call:accept",

            call_id:
                callState.activeCallId
        })
    );


    /*
     * Backend 已接受駕駛端的接聽。
     * 目前尚未進入 WebRTC，
     * 所以這裡直接進入 UI 的 CONNECTED 狀態。
     */

    ShuttleCall.setState(
        "CONNECTED"
    );

    ShuttleCall.setStarted();


    updateCallWindow();

    ShuttleCall.startTimer();
}


// ========================================
// Reject Call
// ========================================

function rejectIncomingCall() {

    const callState =
        ShuttleCall.getState();

    if (!callState.activeCallId) {

        console.warn(
            "[Shuttle Communication] 沒有可拒絕的來電"
        );

        return;
    }


    if (
        !shuttleWebSocket ||
        shuttleWebSocket.readyState !==
        WebSocket.OPEN
    ) {

        console.error(
            "[Shuttle Communication] WebSocket 未連線"
        );

        return;
    }


    console.log(
        "[Shuttle Communication] 拒絕:",
        callState.activeCallId
    );


    shuttleWebSocket.send(
        JSON.stringify({

            type:
                "call:reject",

            call_id:
                callState.activeCallId
        })
    );


    closeCallWindow();
}


// ========================================
// Hangup
// ========================================

function hangupActiveCall() {

    const callState =
        ShuttleCall.getState();

    if (!callState.activeCallId) {

        closeCallWindow();

        return;
    }


    if (
        shuttleWebSocket &&
        shuttleWebSocket.readyState ===
        WebSocket.OPEN
    ) {

        console.log(
            "[Shuttle Communication] 掛斷:",
            callState.activeCallId
        );


        shuttleWebSocket.send(
            JSON.stringify({

                type:
                    "call:hangup",

                call_id:
                    callState.activeCallId
            })
        );

    } else {

        console.warn(
            "[Shuttle Communication] WebSocket 未連線"
        );

    }


    closeCallWindow();
}

// ========================================
// Close Call Window
// ========================================

function closeCallWindow() {

    // ========================================
    // WebRTC Cleanup
    // ========================================

    ShuttleWebRTC.cleanup();
    ShuttleCallAudio.stopRemoteStream();

    // ========================================
    // Call State Cleanup
    // ========================================

    ShuttleCall.clearCall();

    // ========================================
    // 隱藏通話視窗
    // ========================================

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
// Start
// ========================================

if (isNativeShuttleApp) {
    const token = getAuthToken();

    if (token) {
        window.AndroidShuttleBridge.startTracking(token);
    }
} else {
    ShuttleGPS.start();
}

connectShuttleWebSocket();

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

            console.log(
                "[Shuttle Driver] 開始登出"
            );


            // ----------------------------------------
            // Stop GPS
            // ----------------------------------------

            if (isNativeShuttleApp) {
                window.AndroidShuttleBridge.stopTracking();
            } else {
                ShuttleGPS.stop();
            }

            // ----------------------------------------
            // Close Call
            // ----------------------------------------

            const callState =
                ShuttleCall.getState();

            if (callState.activeCallId) {

                hangupActiveCall();

            } else {

                closeCallWindow();

            }


            // ----------------------------------------
            // Close WebSocket
            // ----------------------------------------

            if (
                shuttleWebSocket
            ) {

                console.log(
                    "[Shuttle WebSocket] Closing before logout"
                );


                shuttleWebSocket.close();

                shuttleWebSocket =
                    null;
            }


            // ----------------------------------------
            // Logout
            // ----------------------------------------

            await logout();


            // ----------------------------------------
            // Redirect
            // ----------------------------------------

            window.location.href =
                "../index.html";
        }
    );
}
function callRouteMonitor() {
    if (!shuttleDriverRoute) {
        console.warn("[Call] 尚未取得駕駛路線");
        return;
    }

    if (
        !/^營區開放_[A-E]路線$/.test(
            shuttleDriverRoute
        )
    ) {
        console.warn("[Call] 駕駛路線無效");
        return;
    }

    if (
        !shuttleWebSocket ||
        shuttleWebSocket.readyState !== WebSocket.OPEN
    ) {
        console.warn("[Call] WebSocket 尚未連線");
        return;
    }

    const monitors = shuttleOnlineUsers.filter(user =>
        Number(user.role_id) === 6 &&
        user.user_id &&
        user.access_context === shuttleDriverRoute
    );

    if (monitors.length !== 1) {
        console.warn(
            "[Call] 同路線監控帳號數量不是 1，無法自動選擇",
            {
                route: shuttleDriverRoute,
                count: monitors.length
            }
        );
        return;
    }

    const monitor = monitors[0];
    const currentCall = ShuttleCall.getState();

    if (currentCall.activeCallState) {
        console.warn("[Call] 已有進行中的通話或呼叫");
        return;
    }

    ShuttleCall.setCall({
        callId: null,
        target: monitor,
        state: "CALLING"
    });

    updateCallWindow();

    shuttleWebSocket.send(JSON.stringify({
        type: "call",
        target_user_id: monitor.user_id
    }));
}
const callRouteMonitorButton =
    document.getElementById("call-route-monitor");

if (callRouteMonitorButton) {
    callRouteMonitorButton.addEventListener(
        "click",
        callRouteMonitor
    );
}
console.log(
    "[Native GPS] Driver JS 執行完成；回呼型別：",
    typeof window.handleNativeShuttleGPSStatus
);