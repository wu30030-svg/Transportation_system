console.log("[Shuttle Driver] Driver UI 啟動");


// ========================================
// DOM
// ========================================

const lastUpdateElement =
    document.getElementById("lastUpdate");

const accuracyElement =
    document.getElementById("accuracy");


// ========================================
// API
// ========================================

const SHUTTLE_LOCATION_API =
    `${CONFIG.API_BASE_URL}/api/tracking/shuttle/location`;


// ========================================
// GPS State
// ========================================

let gpsWatchId = null;

// ========================================
// WebSocket State
// ========================================

let shuttleWebSocket = null;

// ========================================
// Call State
// ========================================

let incomingCallId = null;


// ========================================
// GPS
// ========================================

function updateTime() {

    const now = new Date();

    lastUpdateElement.textContent =
        now.toLocaleTimeString("zh-TW", {
            hour12: false
        });
}


async function sendLocationToBackend(position) {

    const token = getAuthToken();

    if (!token) {

        console.error(
            "[Shuttle GPS] 沒有登入 Token"
        );

        accuracyElement.textContent =
            "未登入";

        return;
    }

    const coords =
        position.coords;

    const payload = {

        latitude:
            coords.latitude,

        longitude:
            coords.longitude,

        accuracy:
            coords.accuracy,

        speed:
            coords.speed,

        heading:
            coords.heading,

        recordedAt:
            new Date().toISOString()
    };


    console.log(
        "[Shuttle GPS] 準備送出",
        payload
    );


    try {

        const response =
            await fetch(
                SHUTTLE_LOCATION_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json; charset=utf-8",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(payload)
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "GPS 上傳失敗"
            );
        }


        console.log(
            "[Shuttle GPS] 上傳成功",
            data
        );


        accuracyElement.textContent =
            `±${Math.round(coords.accuracy)} m`;


        updateTime();


    } catch (error) {

        console.error(
            "[Shuttle GPS] 上傳失敗",
            error
        );


        accuracyElement.textContent =
            "傳送失敗";
    }
}


function updateGPS(position) {

    const coords =
        position.coords;


    console.log(
        "[GPS]",
        {
            latitude:
                coords.latitude,

            longitude:
                coords.longitude,

            accuracy:
                coords.accuracy,

            speed:
                coords.speed,

            heading:
                coords.heading
        }
    );


    // 先更新畫面

    accuracyElement.textContent =
        `±${Math.round(coords.accuracy)} m`;


    updateTime();


    // 再送到 Backend

    sendLocationToBackend(
        position
    );
}


function handleGPSError(error) {

    console.error(
        "[GPS] 定位失敗",
        error
    );


    accuracyElement.textContent =
        "定位失敗";


    lastUpdateElement.textContent =
        "--:--:--";
}


function startGPS() {

    if (!navigator.geolocation) {

        console.error(
            "[GPS] 此裝置不支援 Geolocation"
        );


        accuracyElement.textContent =
            "不支援 GPS";


        return;
    }


    console.log(
        "[GPS] 開始取得定位"
    );


    gpsWatchId =
        navigator.geolocation.watchPosition(
            updateGPS,
            handleGPSError,
            {
                enableHighAccuracy:
                    true,

                maximumAge:
                    5000,

                timeout:
                    10000
            }
        );
}


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


    // 避免重複建立連線

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

function handleShuttleWebSocketMessage(data) {

    // ----------------------------------------
    // Authentication Success
    // ----------------------------------------

    if (
        data.type ===
        "auth:success"
    ) {

        console.log(
            "[Shuttle WebSocket] Authentication success:",
            data.user
        );


        // 主動取得目前在線使用者

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


    // ----------------------------------------
    // Online User List
    // ----------------------------------------

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

    // ----------------------------------------
    // Incoming Call
    // ----------------------------------------

    if (
        data.type ===
        "call:incoming"
    ) {

        console.log(
            "[Shuttle Communication] Incoming call:",
            data
        );


        incomingCallId =
            data.call_id;


        const caller =
            data.caller || {};


        const nameElement =
            document.getElementById(
                "incoming-call-name"
            );


        const routeElement =
            document.getElementById(
                "incoming-call-route"
            );


        const overlay =
            document.getElementById(
                "incoming-call-overlay"
            );


        if (nameElement) {

            nameElement.textContent =
                caller.username ||
                "未知使用者";
        }


        if (routeElement) {

            routeElement.textContent =
                caller.access_context ||
                "未知路線";
        }


        if (overlay) {

            overlay.classList.remove(
                "hidden"
            );
        }


        return;
    }

    // ----------------------------------------
    // Force Logout
    // ----------------------------------------

    if (
        data.type ===
        "auth:force-logout"
    ) {

        console.warn(
            "[Shuttle WebSocket] 收到強制登出"
        );


        // 停止 GPS

        if (
            gpsWatchId !== null
        ) {

            navigator.geolocation.clearWatch(
                gpsWatchId
            );

            gpsWatchId =
                null;
        }


        // 關閉 WebSocket

        if (
            shuttleWebSocket
        ) {

            shuttleWebSocket.close();

            shuttleWebSocket =
                null;
        }


        // 回到既有未授權處理

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
// Call Actions
// ========================================

function acceptIncomingCall() {

    if (!incomingCallId) {

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
        incomingCallId
    );


    shuttleWebSocket.send(
        JSON.stringify({

            type:
                "call:accept",

            call_id:
                incomingCallId
        })
    );


    closeIncomingCall();
}


function rejectIncomingCall() {

    if (!incomingCallId) {

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
        incomingCallId
    );


    shuttleWebSocket.send(
        JSON.stringify({

            type:
                "call:reject",

            call_id:
                incomingCallId
        })
    );


    closeIncomingCall();
}


function closeIncomingCall() {

    incomingCallId =
        null;


    const overlay =
        document.getElementById(
            "incoming-call-overlay"
        );


    if (overlay) {

        overlay.classList.add(
            "hidden"
        );
    }
}

// ========================================
// Start
// ========================================

startGPS();

connectShuttleWebSocket();

// ========================================
// Incoming Call UI
// ========================================

const incomingCallAcceptButton =
    document.getElementById(
        "incoming-call-accept"
    );


const incomingCallRejectButton =
    document.getElementById(
        "incoming-call-reject"
    );


if (
    incomingCallAcceptButton
) {

    incomingCallAcceptButton.addEventListener(
        "click",
        acceptIncomingCall
    );
}


if (
    incomingCallRejectButton
) {

    incomingCallRejectButton.addEventListener(
        "click",
        rejectIncomingCall
    );
}

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
            // 停止 GPS 追蹤
            // ----------------------------------------

            if (
                gpsWatchId !== null
            ) {

                navigator.geolocation.clearWatch(
                    gpsWatchId
                );

                gpsWatchId =
                    null;
            }


            // ----------------------------------------
            // 關閉 WebSocket
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
            // 清除登入狀態
            // ----------------------------------------

            await logout();


            // ----------------------------------------
            // 回到登入頁
            // ----------------------------------------

            window.location.href =
                "../index.html";
        }
    );
}