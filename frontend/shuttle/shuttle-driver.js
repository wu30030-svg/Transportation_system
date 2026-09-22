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

let activeCallId = null;

let activeCallTarget = null;

let activeCallState = null;

let callStartedAt = null;

let callTimer = null;

// ========================================
// WebRTC State
// ========================================

let shuttlePeerConnection = null;
let shuttleLocalStream = null;
let shuttleRemoteStream = null;

// WebRTC ICE Candidate 暫存佇列
let pendingShuttleIceCandidates = [];

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


    accuracyElement.textContent =
        `±${Math.round(coords.accuracy)} m`;


    updateTime();


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


        activeCallId =
            data.call_id;


        activeCallTarget =
            data.caller || {};


        activeCallState =
            "INCOMING";


        callStartedAt =
            null;


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

        if (
            data.call_id !== activeCallId
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

        // PeerConnection 還沒建立
        if (
            !shuttlePeerConnection
        ) {

            console.warn(
                "[WebRTC] Driver PeerConnection 不存在，暫存 ICE"
            );

            pendingShuttleIceCandidates.push(
                data.candidate
            );

            return;
        }

        // Remote Description 尚未設定
        if (
            !shuttlePeerConnection.remoteDescription
        ) {

            console.log(
                "[WebRTC] Driver Remote Description 尚未設定，暫存 ICE"
            );

            pendingShuttleIceCandidates.push(
                data.candidate
            );

            return;
        }

        try {

            await shuttlePeerConnection.addIceCandidate(
                new RTCIceCandidate(
                    data.candidate
                )
            );

            console.log(
                "[WebRTC] Driver ICE Candidate 已加入"
            );

        } catch (error) {

            console.error(
                "[WebRTC] Driver 加入 ICE Candidate 失敗:",
                error
            );
        }

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

        if (
            data.call_id ===
            activeCallId
        ) {

            activeCallState =
                "CONNECTED";


            if (!callStartedAt) {

                callStartedAt =
                    Date.now();

            }


            updateCallWindow();

            startCallTimer();
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


        if (
            data.call_id ===
            activeCallId
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


        if (
            !activeCallId ||
            data.call_id ===
            activeCallId
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


        if (
            gpsWatchId !== null
        ) {

            navigator.geolocation.clearWatch(
                gpsWatchId
            );

            gpsWatchId =
                null;
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


    if (!callId || !offer) {

        console.warn(
            "[WebRTC] Offer 資料不完整"
        );

        return;
    }


    if (
        callId !==
        activeCallId
    ) {

        console.warn(
            "[WebRTC] Offer 不屬於目前通話:",
            callId
        );

        return;
    }


    // ========================================
    // 建立 PeerConnection
    // ========================================

    shuttlePeerConnection = new RTCPeerConnection();

    shuttlePeerConnection.onconnectionstatechange = () => {

        console.log(
            "[WebRTC] Driver Connection State:",
            shuttlePeerConnection.connectionState
        );

    };

    shuttlePeerConnection.oniceconnectionstatechange = () => {

        console.log(
            "[WebRTC] Driver ICE Connection State:",
            shuttlePeerConnection.iceConnectionState
        );

    };

    shuttlePeerConnection.onicecandidate =
        event => {

            if (!event.candidate) {
                return;
            }

            console.log(
                "[WebRTC] Driver ICE Candidate:",
                event.candidate
            );

            if (
                !shuttleWebSocket ||
                shuttleWebSocket.readyState !==
                WebSocket.OPEN
            ) {

                console.warn(
                    "[WebRTC] WebSocket 尚未連線，無法傳送 ICE"
                );

                return;
            }

            shuttleWebSocket.send(
                JSON.stringify({

                    type:
                        "call:webrtc-ice",

                    call_id:
                        callId,

                    candidate:
                        event.candidate

                })
            );

        };

    console.log(
        "[WebRTC] Driver ICE Candidate handler 已建立"
    );

    console.log("[WebRTC] Driver PeerConnection 建立完成");


    // ========================================
    // 取得麥克風
    // ========================================

    try {

        shuttleLocalStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

    } catch (error) {

        console.error(
            "[WebRTC] Driver 無法取得麥克風:",
            error
        );

        return;
    }


    console.log(
        "[WebRTC] Driver 麥克風取得成功"
    );


    // ========================================
    // 加入 Local Audio Track
    // ========================================

    shuttleLocalStream
        .getTracks()
        .forEach(
            track => {

                shuttlePeerConnection.addTrack(
                    track,
                    shuttleLocalStream
                );

            }
        );


    console.log(
        "[WebRTC] Driver Local audio track 已加入"
    );


    // ========================================
    // 設定 Remote Offer
    // ========================================

    await shuttlePeerConnection.setRemoteDescription(
        new RTCSessionDescription(
            offer
        )
    );

    // 處理在 Remote Description 設定前收到的 ICE
    if (
        pendingShuttleIceCandidates.length > 0
    ) {

        console.log(
            "[WebRTC] Driver 開始處理暫存 ICE:",
            pendingShuttleIceCandidates.length
        );

        for (
            const candidate of pendingShuttleIceCandidates
        ) {

            try {

                await shuttlePeerConnection.addIceCandidate(
                    new RTCIceCandidate(
                        candidate
                    )
                );

                console.log(
                    "[WebRTC] Driver 暫存 ICE Candidate 已加入"
                );

            } catch (error) {

                console.error(
                    "[WebRTC] Driver 加入暫存 ICE Candidate 失敗:",
                    error
                );
            }
        }

        pendingShuttleIceCandidates = [];
    }

    console.log(
        "[WebRTC] Driver Remote Description 已設定"
    );


    // ========================================
    // 建立 Answer
    // ========================================

    const answer =
        await shuttlePeerConnection.createAnswer();


    await shuttlePeerConnection.setLocalDescription(
        answer
    );


    console.log(
        "[WebRTC] Driver Answer 建立完成:",
        answer
    );


    // ========================================
    // 傳送 Answer
    // ========================================

    if (
        !shuttleWebSocket ||
        shuttleWebSocket.readyState !==
        WebSocket.OPEN
    ) {

        console.warn(
            "[WebRTC] WebSocket 尚未連線"
        );

        return;
    }


    shuttleWebSocket.send(
        JSON.stringify({

            type:
                "call:webrtc-answer",

            call_id:
                callId,

            answer:
                shuttlePeerConnection.localDescription

        })
    );


    console.log(
        "[WebRTC] Driver Answer 已送出:",
        callId
    );
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


    const target =
        activeCallTarget || {};


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
        activeCallState ===
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
        activeCallState ===
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
// Call Timer
// ========================================

function startCallTimer() {

    stopCallTimer();


    callTimer =
        setInterval(
            () => {

                if (!callStartedAt) {

                    return;

                }


                const elapsed =
                    Math.floor(
                        (
                            Date.now() -
                            callStartedAt
                        ) / 1000
                    );


                const minutes =
                    Math.floor(
                        elapsed / 60
                    );


                const seconds =
                    elapsed % 60;


                const timerElement =
                    document.getElementById(
                        "shuttle-call-timer"
                    );


                if (timerElement) {

                    timerElement.textContent =
                        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

                }

            },
            1000
        );
}


function stopCallTimer() {

    if (callTimer) {

        clearInterval(
            callTimer
        );

        callTimer =
            null;
    }
}


// ========================================
// Accept Call
// ========================================

function acceptIncomingCall() {

    if (!activeCallId) {

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
        activeCallId
    );


    shuttleWebSocket.send(
        JSON.stringify({

            type:
                "call:accept",

            call_id:
                activeCallId
        })
    );


    /*
     * Backend 已接受駕駛端的接聽。
     * 目前尚未進入 WebRTC，
     * 所以這裡直接進入 UI 的 CONNECTED 狀態。
     */

    activeCallState =
        "CONNECTED";


    callStartedAt =
        Date.now();


    updateCallWindow();

    startCallTimer();
}


// ========================================
// Reject Call
// ========================================

function rejectIncomingCall() {

    if (!activeCallId) {

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
        activeCallId
    );


    shuttleWebSocket.send(
        JSON.stringify({

            type:
                "call:reject",

            call_id:
                activeCallId
        })
    );


    closeCallWindow();
}


// ========================================
// Hangup
// ========================================

function hangupActiveCall() {

    if (!activeCallId) {

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
            activeCallId
        );


        shuttleWebSocket.send(
            JSON.stringify({

                type:
                    "call:hangup",

                call_id:
                    activeCallId
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
    // 停止通話計時器
    // ========================================

    stopCallTimer();


    // ========================================
    // WebRTC Cleanup
    // ========================================

    // ----------------------------------------
    // 停止 Local Audio Tracks
    // ----------------------------------------

    if (shuttleLocalStream) {

        shuttleLocalStream
            .getTracks()
            .forEach(track => {

                track.stop();

                console.log(
                    "[WebRTC] Driver Local Audio Track 已停止"
                );

            });

        shuttleLocalStream = null;
    }


    // ----------------------------------------
    // 關閉 PeerConnection
    // ----------------------------------------

    if (shuttlePeerConnection) {

        shuttlePeerConnection.close();

        shuttlePeerConnection = null;

        console.log(
            "[WebRTC] Driver PeerConnection 已關閉"
        );
    }


    // ----------------------------------------
    // 清除 Remote Stream
    // ----------------------------------------

    if (shuttleRemoteStream) {

        shuttleRemoteStream
            .getTracks()
            .forEach(track => {

                track.stop();

            });

        shuttleRemoteStream = null;

        console.log(
            "[WebRTC] Driver Remote MediaStream 已清除"
        );
    }


    // ----------------------------------------
    // 清除 Pending ICE Candidates
    // ----------------------------------------

    pendingShuttleIceCandidates = [];

    console.log(
        "[WebRTC] Driver Pending ICE Candidates 已清除"
    );


    // ========================================
    // Call State Cleanup
    // ========================================

    activeCallId =
        null;


    activeCallTarget =
        null;


    activeCallState =
        null;


    callStartedAt =
        null;


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

startGPS();

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
            // Close Call
            // ----------------------------------------

            if (activeCallId) {

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