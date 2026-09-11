const https = require("https");

const pool = require("../../../config/db");


// ========================================
// CCTV Relay Settings
// ========================================

const RECONNECT_DELAY_MS = 3000;
const UPSTREAM_TIMEOUT_MS = 15000;
const WATCHDOG_TIMEOUT_MS = 10000;

const SNAPSHOT_TIMEOUT_MS = 10000;
const SNAPSHOT_MAX_SIZE_BYTES = 5 * 1024 * 1024;


// ========================================
// Get CCTV Source
// ========================================

async function getCctvSource(cameraId) {

    const result = await pool.query(
        `
        SELECT
            camera_id,
            camera_name,
            camera_url
        FROM cameras
        WHERE camera_id = $1;
        `,
        [cameraId]
    );


    if (result.rows.length === 0) {

        const error =
            new Error("Camera not found");

        error.statusCode = 404;

        throw error;
    }


    return result.rows[0];
}


// ========================================
// Get CCTV JPEG Snapshot
// ========================================
//
// Snapshot CCTV 與 MJPEG Relay 完全分離。
// 每次呼叫只向 Source 取得一張 JPEG。
// 不建立長時間 Relay Session。
// ========================================

async function getCctvSnapshot(cameraId) {

    const camera =
        await getCctvSource(cameraId);


    if (!camera.camera_url) {

        const error =
            new Error("Camera URL not configured");

        error.statusCode = 500;

        throw error;
    }


    console.log(
        "[CCTV Snapshot] Connecting:",
        camera.camera_id,
        camera.camera_url
    );


    return new Promise(
        (resolve, reject) => {

            let settled = false;
            let totalSize = 0;

            const chunks = [];


            function finishError(error) {

                if (settled) {
                    return;
                }

                settled = true;

                reject(error);
            }


            function finishSuccess(buffer) {

                if (settled) {
                    return;
                }

                settled = true;

                resolve({
                    cameraId: camera.camera_id,
                    cameraName: camera.camera_name,
                    contentType: "image/jpeg",
                    buffer
                });
            }


            const request =
                https.get(
                    camera.camera_url,
                    {
                        headers: {

                            "User-Agent":
                                "Transportation-System/1.0",

                            "Accept":
                                "image/jpeg"
                        }
                    },
                    response => {

                        console.log(
                            "[CCTV Snapshot] Upstream status:",
                            response.statusCode
                        );


                        console.log(
                            "[CCTV Snapshot] Content-Type:",
                            response.headers["content-type"]
                        );


                        // ========================================
                        // Invalid Status
                        // ========================================

                        if (
                            response.statusCode < 200 ||
                            response.statusCode >= 300
                        ) {

                            response.resume();

                            const error =
                                new Error(
                                    `CCTV snapshot upstream returned ${response.statusCode}`
                                );

                            error.statusCode = 502;

                            finishError(error);

                            return;
                        }


                        // ========================================
                        // Collect JPEG
                        // ========================================

                        response.on(
                            "data",
                            chunk => {

                                if (settled) {
                                    return;
                                }


                                totalSize +=
                                    chunk.length;


                                if (
                                    totalSize >
                                    SNAPSHOT_MAX_SIZE_BYTES
                                ) {

                                    console.error(
                                        "[CCTV Snapshot] Response too large:",
                                        camera.camera_id
                                    );


                                    request.destroy();


                                    const error =
                                        new Error(
                                            "CCTV snapshot is too large"
                                        );

                                    error.statusCode = 502;

                                    finishError(error);

                                    return;
                                }


                                chunks.push(chunk);
                            }
                        );


                        // ========================================
                        // Snapshot Complete
                        // ========================================

                        response.on(
                            "end",
                            () => {

                                if (settled) {
                                    return;
                                }


                                const buffer =
                                    Buffer.concat(
                                        chunks
                                    );


                                if (
                                    buffer.length === 0
                                ) {

                                    const error =
                                        new Error(
                                            "CCTV snapshot returned empty response"
                                        );

                                    error.statusCode = 502;

                                    finishError(error);

                                    return;
                                }


                                console.log(
                                    "[CCTV Snapshot] Snapshot received:",
                                    camera.camera_id,
                                    buffer.length,
                                    "bytes"
                                );


                                finishSuccess(
                                    buffer
                                );
                            }
                        );


                        // ========================================
                        // Upstream Error
                        // ========================================

                        response.on(
                            "error",
                            error => {

                                console.error(
                                    "[CCTV Snapshot] Upstream error:",
                                    camera.camera_id,
                                    error.message
                                );


                                const snapshotError =
                                    new Error(
                                        "CCTV snapshot upstream error"
                                    );

                                snapshotError.statusCode = 502;

                                finishError(
                                    snapshotError
                                );
                            }
                        );
                    }
                );


            // ========================================
            // Snapshot Timeout
            // ========================================

            request.setTimeout(
                SNAPSHOT_TIMEOUT_MS,
                () => {

                    console.error(
                        "[CCTV Snapshot] Timeout:",
                        camera.camera_id
                    );


                    request.destroy();


                    const error =
                        new Error(
                            "CCTV snapshot request timeout"
                        );

                    error.statusCode = 504;

                    finishError(error);
                }
            );


            // ========================================
            // Request Error
            // ========================================

            request.on(
                "error",
                error => {

                    console.error(
                        "[CCTV Snapshot] Connection error:",
                        camera.camera_id,
                        error.message
                    );


                    const snapshotError =
                        new Error(
                            "Unable to retrieve CCTV snapshot"
                        );

                    snapshotError.statusCode = 502;

                    finishError(
                        snapshotError
                    );
                }
            );
        }
    );
}


// ========================================
// Relay CCTV MJPEG Stream
// ========================================

async function relayCctvStream(
    cameraId,
    clientResponse
) {

    const camera =
        await getCctvSource(cameraId);


    if (!camera.camera_url) {

        const error =
            new Error("Camera URL not configured");

        error.statusCode = 500;

        throw error;
    }


    // ========================================
    // Relay Session State
    // ========================================

    let upstreamRequest = null;
    let upstreamResponse = null;

    let reconnectTimer = null;
    let watchdogTimer = null;

    let sessionStopped = false;
    let connecting = false;


    // ========================================
    // Stop Watchdog
    // ========================================

    function stopWatchdog() {

        if (!watchdogTimer) {
            return;
        }

        clearTimeout(watchdogTimer);

        watchdogTimer = null;
    }


    // ========================================
    // Reset Watchdog
    // ========================================

    function resetWatchdog() {

        if (sessionStopped) {
            return;
        }


        stopWatchdog();


        watchdogTimer =
            setTimeout(
                () => {

                    watchdogTimer = null;


                    if (sessionStopped) {
                        return;
                    }


                    console.warn(
                        "[CCTV Relay] Watchdog timeout:",
                        camera.camera_id
                    );


                    if (upstreamRequest) {

                        upstreamRequest.destroy();

                        upstreamRequest = null;
                    }


                    if (upstreamResponse) {

                        upstreamResponse.destroy();

                        upstreamResponse = null;
                    }


                    scheduleReconnect();

                },
                WATCHDOG_TIMEOUT_MS
            );
    }


    // ========================================
    // Stop Relay Session
    // ========================================

    function stopRelaySession() {

        if (sessionStopped) {
            return;
        }


        sessionStopped = true;


        stopWatchdog();


        if (reconnectTimer) {

            clearTimeout(
                reconnectTimer
            );

            reconnectTimer = null;
        }


        if (upstreamRequest) {

            upstreamRequest.destroy();

            upstreamRequest = null;
        }


        if (upstreamResponse) {

            upstreamResponse.destroy();

            upstreamResponse = null;
        }
    }


    // ========================================
    // Schedule Reconnect
    // ========================================

    function scheduleReconnect() {

        if (sessionStopped) {
            return;
        }


        if (reconnectTimer) {
            return;
        }


        console.log(
            "[CCTV Relay] Reconnecting in 3 seconds:",
            camera.camera_id
        );


        reconnectTimer =
            setTimeout(
                () => {

                    reconnectTimer = null;


                    if (sessionStopped) {
                        return;
                    }


                    connectUpstream();

                },
                RECONNECT_DELAY_MS
            );
    }


    // ========================================
    // Handle Upstream End
    // ========================================

    function handleUpstreamEnd() {

        if (sessionStopped) {
            return;
        }


        if (!upstreamRequest && !upstreamResponse) {
            return;
        }


        const currentRequest =
            upstreamRequest;

        const currentResponse =
            upstreamResponse;


        upstreamRequest = null;
        upstreamResponse = null;


        stopWatchdog();


        console.warn(
            "[CCTV Relay] Upstream ended:",
            camera.camera_id
        );


        if (currentRequest) {
            currentRequest.destroy();
        }


        if (currentResponse) {
            currentResponse.destroy();
        }


        scheduleReconnect();
    }


    // ========================================
    // Connect Upstream CCTV
    // ========================================

    function connectUpstream() {

        if (sessionStopped) {
            return;
        }


        if (connecting) {
            return;
        }


        connecting = true;


        console.log(
            "[CCTV Relay] Connecting:",
            camera.camera_id,
            camera.camera_url
        );


        const request =
            https.get(
                camera.camera_url,
                {
                    headers: {

                        "User-Agent":
                            "Transportation-System/1.0",

                        "Accept":
                            "multipart/x-mixed-replace"
                    }
                },
                response => {

                    connecting = false;

                    upstreamResponse =
                        response;


                    console.log(
                        "[CCTV Relay] Upstream status:",
                        response.statusCode
                    );


                    console.log(
                        "[CCTV Relay] Content-Type:",
                        response.headers["content-type"]
                    );


                    // ========================================
                    // Invalid Upstream Status
                    // ========================================

                    if (
                        response.statusCode < 200 ||
                        response.statusCode >= 300
                    ) {

                        response.resume();


                        upstreamRequest = null;
                        upstreamResponse = null;


                        console.error(
                            "[CCTV Relay] Invalid upstream status:",
                            response.statusCode,
                            camera.camera_id
                        );


                        scheduleReconnect();

                        return;
                    }


                    // ========================================
                    // Send Client Headers
                    // ========================================

                    if (
                        !clientResponse.headersSent
                    ) {

                        const contentType =
                            response.headers["content-type"] ||
                            "multipart/x-mixed-replace";


                        clientResponse.statusCode = 200;


                        clientResponse.setHeader(
                            "Content-Type",
                            contentType
                        );


                        clientResponse.setHeader(
                            "Cache-Control",
                            "no-cache, no-store, must-revalidate"
                        );


                        clientResponse.setHeader(
                            "Pragma",
                            "no-cache"
                        );


                        clientResponse.setHeader(
                            "Expires",
                            "0"
                        );


                        clientResponse.setHeader(
                            "Connection",
                            "keep-alive"
                        );
                    }


                    // ========================================
                    // Start Watchdog
                    // ========================================

                    resetWatchdog();


                    // ========================================
                    // Forward MJPEG Stream
                    // ========================================

                    response.pipe(
                        clientResponse,
                        {
                            end: false
                        }
                    );


                    // ========================================
                    // Monitor Incoming Data
                    // ========================================

                    response.on(
                        "data",
                        () => {

                            resetWatchdog();
                        }
                    );


                    // ========================================
                    // Upstream Error
                    // ========================================

                    response.on(
                        "error",
                        error => {

                            console.error(
                                "[CCTV Relay] Upstream error:",
                                error.message
                            );


                            handleUpstreamEnd();
                        }
                    );


                    // ========================================
                    // Upstream Close
                    // ========================================

                    response.on(
                        "close",
                        () => {

                            console.log(
                                "[CCTV Relay] Upstream connection closed:",
                                camera.camera_id
                            );


                            handleUpstreamEnd();
                        }
                    );


                    // ========================================
                    // Upstream End
                    // ========================================

                    response.on(
                        "end",
                        () => {

                            console.log(
                                "[CCTV Relay] Upstream stream ended:",
                                camera.camera_id
                            );


                            handleUpstreamEnd();
                        }
                    );
                }
            );


        upstreamRequest =
            request;


        // ========================================
        // Upstream Connection Timeout
        // ========================================

        request.setTimeout(
            UPSTREAM_TIMEOUT_MS,
            () => {

                console.error(
                    "[CCTV Relay] Upstream connection timeout:",
                    camera.camera_id
                );


                request.destroy();
            }
        );


        // ========================================
        // Upstream Request Error
        // ========================================

        request.on(
            "error",
            error => {

                connecting = false;


                console.error(
                    "[CCTV Relay] Connection error:",
                    error.message
                );


                upstreamRequest = null;


                if (sessionStopped) {
                    return;
                }


                stopWatchdog();


                scheduleReconnect();
            }
        );
    }


    // ========================================
    // Client Disconnected
    // ========================================

    clientResponse.on(
        "close",
        () => {

            console.log(
                "[CCTV Relay] Client disconnected:",
                camera.camera_id
            );


            stopRelaySession();
        }
    );


    // ========================================
    // Client Error
    // ========================================

    clientResponse.on(
        "error",
        error => {

            console.error(
                "[CCTV Relay] Client response error:",
                error.message
            );


            stopRelaySession();
        }
    );


    // ========================================
    // Start First Upstream Connection
    // ========================================

    connectUpstream();
}


module.exports = {
    getCctvSource,
    getCctvSnapshot,
    relayCctvStream
};