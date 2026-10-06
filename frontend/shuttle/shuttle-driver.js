console.log("[Shuttle Driver] Driver UI 啟動");


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
// GPS Init
// ========================================================

ShuttleGPS.init({

    lastUpdateElement:
        lastUpdateElement,

    accuracyElement:
        accuracyElement,

    statusHandler:
        updateDriverGPSStatus
});

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

    // ========================================
    // Authentication Success
    // ========================================

    if (
        data.type ===
        "auth:success"
    ) {

        console.log(
            "[Shuttle WebSocket] Authentication success:",
            data.user
        );


        if (
            shuttleWebSocket &&
            shuttleWebSocket.readyState ===
            WebSocket.OPEN
        ) {

            shuttleWebSocket.send(
                JSON.stringify({
                    type:
                        "online:list"
                })
            );
        }


        return;
    }


    // ========================================
    // Online User List
    // ========================================

    if (
        data.type ===
        "online:list"
    ) {

        console.log(
            "[Shuttle WebSocket] Online users:",
            data.users
        );


        return;
    }


    // ========================================
    // Incoming Call
    // ========================================

    if (
        data.type ===
        "call:incoming"
    ) {

        console.log(
            "[Shuttle Communication] 收到來電:",
            data
        );


        ShuttleCall.setCall({
            callId:
                data.call_id,

            target:
                data.caller || {},

            state:
                "INCOMING"
        });

        updateCallWindow();

        return;
    }

    // ========================================
    // WebRTC Offer
    // ========================================

    if (
        data.type ===
        "call:webrtc-offer"
    ) {

        handleShuttleWebRTCOffer(
            data
        );

        return;
    }

    if (
        data.type ===
        "call:webrtc-ice"
    ) {

        console.log(
            "[WebRTC] Driver 收到 ICE Candidate:",
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
    // Call Accepted
    // ========================================

    if (
        data.type ===
        "call:accepted"
    ) {

        console.log(
            "[Shuttle Communication] 通話已接通:",
            data
        );


        /*
         * 駕駛端通常不會收到自己的
         * call:accepted。
         *
         * 保留此處是為了讓雙方狀態
         * 在未來擴充時可以共用。
         */

        const callState =
            ShuttleCall.getState();

        if (
            data.call_id ===
            callState.activeCallId
        ) {

            ShuttleCall.setState(
                "CONNECTED"
            );


            if (!callState.callStartedAt) {

                ShuttleCall.setStarted();

            }


            updateCallWindow();

            ShuttleCall.startTimer();
        }


        return;
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

        ShuttleGPS.stop();

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

    console.log(
        "[WebRTC] Driver 收到 Monitor Remote Audio Stream"
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

        audioElement.style.display =
            "none";

        document.body.appendChild(
            audioElement
        );
    }


    audioElement.srcObject =
        stream;


    audioElement.play()
        .then(() => {

            console.log(
                "[WebRTC] Driver Remote Audio 開始播放"
            );

        })
        .catch(error => {

            console.warn(
                "[WebRTC] Driver Remote Audio 播放失敗:",
                error
            );

        });
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

ShuttleGPS.start();

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

            ShuttleGPS.stop();

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