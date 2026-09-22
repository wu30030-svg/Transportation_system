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

let shuttleMap = null;

const shuttleMarkers = new Map();

let shuttleRefreshTimer = null;

let shuttleLocations = [];

// ========================================
// Map Display Filter
// ========================================

let shuttleMapDisplayMode = "all";

// ========================================
// WebSocket State
// ========================================

let shuttleWebSocket = null;

let shuttleOnlineUsers = [];

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
// Map Initialization
// ========================================

async function initShuttleMap() {

    if (shuttleMap) {
        return;
    }

    if (!window.google || !google.maps) {

        console.error(
            "[Shuttle Monitor] Google Maps 尚未載入"
        );

        return;
    }

    await google.maps.importLibrary("marker");

    const targetLocation = {
        lat: 24.239268,
        lng: 120.623498
    };

    shuttleMap = new google.maps.Map(
        document.getElementById("shuttleMap"),
        {
            center: targetLocation,
            zoom: 14,
            mapId: "4226f603895ec596617ae2e5",
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            gestureHandling: "greedy"
        }
    );

    console.log(
        "[Shuttle Monitor] Google Maps 初始化完成"
    );

    await refreshShuttleLocations();

    shuttleRefreshTimer =
        setInterval(
            refreshShuttleLocations,
            SHUTTLE_REFRESH_INTERVAL
        );
}


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

    if (
        shuttleWebSocket &&
        (
            shuttleWebSocket.readyState ===
            WebSocket.OPEN ||
            shuttleWebSocket.readyState ===
            WebSocket.CONNECTING
        )
    ) {

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
    // Connected
    // ========================================

    shuttleWebSocket.addEventListener(
        "open",
        () => {

            console.log(
                "[Shuttle WebSocket] Connected"
            );

            shuttleWebSocket.send(
                JSON.stringify({
                    type: "auth",
                    token
                })
            );

        }
    );


    // ========================================
    // Message
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
    // Error
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
    // Close
    // ========================================

    shuttleWebSocket.addEventListener(
        "close",
        () => {

            console.log(
                "[Shuttle WebSocket] Closed"
            );

            shuttleWebSocket = null;

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

    if (data.type === "auth:success") {

        console.log(
            "[Shuttle WebSocket] Authentication success:",
            data.user
        );

        shuttleWebSocket.send(
            JSON.stringify({
                type: "online:list"
            })
        );

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

        if (
            !shuttlePeerConnection
        ) {

            console.warn(
                "[WebRTC] Monitor PeerConnection 不存在，暫存 ICE"
            );

            pendingShuttleIceCandidates.push(
                data.candidate
            );

            return;
        }

        if (
            !shuttlePeerConnection.remoteDescription
        ) {

            console.log(
                "[WebRTC] Monitor Remote Description 尚未設定，暫存 ICE"
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
                "[WebRTC] Monitor ICE Candidate 已加入"
            );

        } catch (error) {

            console.error(
                "[WebRTC] Monitor 加入 ICE Candidate 失敗:",
                error
            );
        }

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

        activeCallId =
            data.call_id;

        activeCallState =
            "CONNECTED";

        callStartedAt =
            Date.now();

        updateCallWindow();

        startCallTimer();

        startShuttleWebRTCAsCaller(
            data.call_id
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


    if (
        callId !==
        activeCallId
    ) {

        console.warn(
            "[WebRTC] Answer 不屬於目前通話:",
            callId
        );

        return;
    }


    if (
        !shuttlePeerConnection
    ) {

        console.warn(
            "[WebRTC] Monitor PeerConnection 不存在"
        );

        return;
    }


    await shuttlePeerConnection.setRemoteDescription(
        new RTCSessionDescription(
            answer
        )
    );


    console.log(
        "[WebRTC] Monitor Remote Description 已設定"
    );

    if (
        pendingShuttleIceCandidates.length > 0
    ) {

        console.log(
            "[WebRTC] Monitor 開始處理暫存 ICE:",
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
                    "[WebRTC] Monitor 暫存 ICE Candidate 已加入"
                );

            } catch (error) {

                console.error(
                    "[WebRTC] Monitor 加入暫存 ICE Candidate 失敗:",
                    error
                );
            }
        }

        pendingShuttleIceCandidates = [];
    }
}

// ========================================
// WebRTC - Caller
// ========================================

async function startShuttleWebRTCAsCaller(
    callId
) {

    console.log(
        "[WebRTC] 開始建立 Caller PeerConnection:",
        callId
    );


    // ========================================
    // 建立 PeerConnection
    // ========================================

    shuttlePeerConnection =
        new RTCPeerConnection();

    shuttlePeerConnection.onconnectionstatechange = () => {

        console.log(
            "[WebRTC] Monitor Connection State:",
            shuttlePeerConnection.connectionState
        );

    };

    shuttlePeerConnection.oniceconnectionstatechange = () => {

        console.log(
            "[WebRTC] Monitor ICE Connection State:",
            shuttlePeerConnection.iceConnectionState
        );

    };

    shuttlePeerConnection.onicecandidate =
        event => {

            if (!event.candidate) {
                return;
            }

            console.log(
                "[WebRTC] Monitor ICE Candidate:",
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
        "[WebRTC] RTCPeerConnection 建立完成"
    );

    shuttlePeerConnection.ontrack = event => {

        console.log(
            "[WebRTC] Monitor 收到 Remote Audio Track:",
            event.track
        );

        if (!event.streams || !event.streams[0]) {

            console.warn(
                "[WebRTC] Monitor 找不到 Remote MediaStream"
            );

            return;
        }

        shuttleRemoteStream =
            event.streams[0];

        console.log(
            "[WebRTC] Monitor Remote MediaStream 已取得:",
            shuttleRemoteStream
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

            audioElement.autoplay = true;

            audioElement.playsInline = true;

            document.body.appendChild(
                audioElement
            );

        }

        audioElement.srcObject =
            shuttleRemoteStream;

        console.log(
            "[WebRTC] Monitor Remote Audio 已連接至 Audio Element"
        );

        audioElement
            .play()
            .then(() => {

                console.log(
                    "[WebRTC] Monitor Remote Audio 開始播放"
                );

            })
            .catch(error => {

                console.error(
                    "[WebRTC] Monitor Remote Audio 播放失敗:",
                    error
                );

            });

    };

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
            "[WebRTC] 無法取得麥克風:",
            error
        );

        return;
    }


    console.log(
        "[WebRTC] 麥克風取得成功"
    );


    // ========================================
    // 加入本地音訊 Track
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
        "[WebRTC] Local audio track 已加入"
    );


    // ========================================
    // 建立 Offer
    // ========================================

    const offer =
        await shuttlePeerConnection.createOffer();


    await shuttlePeerConnection.setLocalDescription(
        offer
    );


    console.log(
        "[WebRTC] Offer 建立完成:",
        offer
    );


    // ========================================
    // 傳送 Offer
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
                "call:webrtc-offer",

            call_id:
                callId,

            offer:
                shuttlePeerConnection.localDescription

        })
    );


    console.log(
        "[WebRTC] Offer 已送出:",
        callId
    );
}

// ========================================
// Fetch Shuttle Locations
// ========================================

async function refreshShuttleLocations() {

    const token = getAuthToken();

    if (!token) {

        console.error(
            "[Shuttle Monitor] 沒有登入 Token"
        );

        return;
    }

    try {

        const response = await fetch(
            SHUTTLE_LOCATION_API,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (response.status === 401) {

            console.warn(
                "[Shuttle Monitor] Token 已失效"
            );

            if (
                typeof handleUnauthorized ===
                "function"
            ) {

                handleUnauthorized();

            }

            return;
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                "無法取得接駁車位置"
            );
        }

        const locations =
            Array.isArray(data.data)
                ? data.data
                : [];

        shuttleLocations = locations;

        console.log(
            `[Shuttle Monitor] 收到 ${locations.length} 筆定位資料`
        );

        renderARouteLocations(
            locations
        );

        renderVehiclePanel();

        renderCommunicationPanel();

    } catch (error) {

        console.error(
            "[Shuttle Monitor] 取得定位失敗:",
            error
        );
    }
}


// ========================================
// Render A Route
// ========================================

function renderARouteLocations(locations) {

    const currentIds =
        new Set();


    locations.forEach(location => {

        const personnelNumber =
            location.personnel_number;

        if (
            typeof personnelNumber !==
            "string"
        ) {

            return;
        }


        if (
            typeof location.latitude !==
            "number" ||
            typeof location.longitude !==
            "number"
        ) {

            return;
        }


        // ========================================
        // Map Display Filter
        // ========================================

        if (
            shuttleMapDisplayMode ===
            "online" &&
            location.gps_status !==
            "ONLINE"
        ) {

            return;
        }


        currentIds.add(
            personnelNumber
        );


        updateShuttleMarker(
            personnelNumber,
            location.latitude,
            location.longitude
        );

    });


    // ========================================
    // Remove Hidden / Missing Markers
    // ========================================

    shuttleMarkers.forEach(
        (
            marker,
            personnelNumber
        ) => {

            if (
                !currentIds.has(
                    personnelNumber
                )
            ) {

                marker.map = null;

                shuttleMarkers.delete(
                    personnelNumber
                );
            }

        }
    );
}


// ========================================
// Create / Update Marker
// ========================================

function updateShuttleMarker(
    personnelNumber,
    latitude,
    longitude
) {

    const position = {
        lat: latitude,
        lng: longitude
    };

    let marker =
        shuttleMarkers.get(
            personnelNumber
        );

    if (!marker) {

        marker =
            createShuttleMarker(
                personnelNumber,
                position
            );

        shuttleMarkers.set(
            personnelNumber,
            marker
        );

        return;
    }

    marker.position =
        position;
}


// ========================================
// Create Shuttle Marker
// ========================================

function createShuttleMarker(
    personnelNumber,
    position
) {

    const markerElement =
        document.createElement(
            "div"
        );

    markerElement.className =
        "shuttle-marker";


    const dot =
        document.createElement(
            "span"
        );

    dot.className =
        "shuttle-dot";


    const label =
        document.createElement(
            "span"
        );

    label.className =
        "shuttle-label";


    const vehicleNumber =
        personnelNumber;

    label.textContent =
        vehicleNumber;


    markerElement.appendChild(
        dot
    );

    markerElement.appendChild(
        label
    );


    const marker =
        new google.maps.marker.AdvancedMarkerElement({
            map: shuttleMap,
            position,
            content: markerElement,
            title: vehicleNumber
        });

    return marker;
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
        activeCallTarget || {};


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
        activeCallState ===
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

    }


    callWindow.classList.remove(
        "hidden"
    );
}

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

        callTimer = null;

    }

}

function hangupActiveCall() {

    if (!activeCallId) {

        return;
    }


    if (
        !shuttleWebSocket ||
        shuttleWebSocket.readyState !==
        WebSocket.OPEN
    ) {

        console.warn(
            "[Shuttle Communication] WebSocket 未連線"
        );

        return;
    }


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


    closeCallWindow();
}

function closeCallWindow() {

    // ========================================
    // 停止通話計時器
    // ========================================

    stopCallTimer();


    // ========================================
    // 停止 Local Audio Tracks
    // ========================================

    if (shuttleLocalStream) {

        shuttleLocalStream
            .getTracks()
            .forEach(track => {

                track.stop();

                console.log(
                    "[WebRTC] Monitor Local Audio Track 已停止"
                );

            });

        shuttleLocalStream = null;
    }


    // ========================================
    // 關閉 PeerConnection
    // ========================================

    if (shuttlePeerConnection) {

        shuttlePeerConnection.close();

        shuttlePeerConnection = null;

        console.log(
            "[WebRTC] Monitor PeerConnection 已關閉"
        );
    }


    // ========================================
    // 清除 Remote Stream
    // ========================================

    if (shuttleRemoteStream) {

        shuttleRemoteStream
            .getTracks()
            .forEach(track => {

                track.stop();

            });

        shuttleRemoteStream = null;

        console.log(
            "[WebRTC] Monitor Remote MediaStream 已清除"
        );
    }


    // ========================================
    // 清除 Remote Audio Element
    // ========================================

    const audioElement =
        document.getElementById(
            "shuttle-remote-audio"
        );

    if (audioElement) {

        audioElement.pause();

        audioElement.srcObject = null;

        audioElement.remove();

        console.log(
            "[WebRTC] Monitor Remote Audio Element 已移除"
        );
    }


    // ========================================
    // 清除 Pending ICE Candidates
    // ========================================

    pendingShuttleIceCandidates = [];


    // ========================================
    // 清除 Call State
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


                    activeCallId =
                        null;

                    activeCallTarget =
                        targetDriver;

                    activeCallState =
                        "CALLING";

                    callStartedAt =
                        null;

                    updateCallWindow();

                    /*
                     * 確認 WebSocket
                     */

                    if (
                        !shuttleWebSocket ||
                        shuttleWebSocket.readyState !== WebSocket.OPEN
                    ) {

                        console.warn(
                            "[Shuttle Communication] WebSocket 尚未連線"
                        );

                        return;
                    }


                    /*
                     * 發送通話請求
                     */

                    shuttleWebSocket.send(
                        JSON.stringify({
                            type: "call",
                            target_user_id: targetUserId
                        })
                    );


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


                shuttleMapDisplayMode =
                    mode;


                updateMapDisplaySettings();


                renderARouteLocations(
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
            shuttleMapDisplayMode;


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

function waitForGoogleMaps() {

    if (
        window.google &&
        google.maps &&
        google.maps.importLibrary
    ) {

        initShuttleMap();

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

        if (shuttleRefreshTimer) {

            clearInterval(
                shuttleRefreshTimer
            );

            shuttleRefreshTimer = null;
        }


        if (shuttleWebSocket) {

            shuttleWebSocket.close();

            shuttleWebSocket = null;
        }

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

            if (shuttleRefreshTimer) {

                clearInterval(
                    shuttleRefreshTimer
                );

                shuttleRefreshTimer = null;
            }


            if (shuttleWebSocket) {

                shuttleWebSocket.close();

                shuttleWebSocket = null;
            }


            await logout();


            window.location.href =
                "../index.html";

        }
    );

}