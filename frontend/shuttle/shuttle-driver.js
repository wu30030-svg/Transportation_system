console.log("[Shuttle Driver] Driver UI 啟動");


// ========================================
// DOM
// ========================================

const lastUpdateElement =
    document.getElementById("lastUpdate");

const accuracyElement =
    document.getElementById("accuracy");

ShuttleGPS.init({
    lastUpdateElement:
        lastUpdateElement,

    accuracyElement:
        accuracyElement
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
// Call State
// ========================================

let activeCallId = null;

let activeCallTarget = null;

let activeCallState = null;

let callStartedAt = null;

let callTimer = null;

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

    ShuttleWebRTC.cleanup();

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