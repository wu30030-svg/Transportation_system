require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const express = require("express");
const cors = require("cors");
const http = require("http");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const {
    authenticateWebSocketToken
} = require("./middleware/authMiddleware");

const {
    canCall
} = require("./services/callPermissionService");

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api", require("./routes"));

console.log(
    "DATABASE_URL exists:",
    Boolean(process.env.DATABASE_URL)
);

const PORT = process.env.PORT || 3000;

// ========================================
// HTTP Server
// ========================================

const server = http.createServer(app);

// ========================================
// WebSocket Server
// ========================================

const wss = new WebSocketServer({
    server,
    path: "/ws"
});

// ========================================
// Online WebSocket Users
// ========================================

const onlineUsers = new Map();

const activeCalls = new Map();

// ========================================
// Temporary Force Logout
// ========================================

app.post("/api/debug/force-logout/:username", (req, res) => {

    const username = req.params.username;

    let targetSocket = null;
    let targetUserId = null;

    for (const [userId, socket] of onlineUsers.entries()) {

        if (
            socket.user &&
            socket.user.username === username
        ) {
            targetSocket = socket;
            targetUserId = userId;
            break;
        }
    }

    if (!targetSocket) {

        return res.status(404).json({
            success: false,
            message: "User is not online"
        });
    }

    /*
     * 找出與這個使用者相關的進行中通話
     */

    for (const [callId, call] of activeCalls.entries()) {

        if (
            call.callerUserId === targetUserId ||
            call.targetUserId === targetUserId
        ) {

            const otherUserId =
                call.callerUserId === targetUserId
                    ? call.targetUserId
                    : call.callerUserId;

            const otherSocket =
                onlineUsers.get(otherUserId);

            if (
                otherSocket &&
                otherSocket.readyState === 1
            ) {

                otherSocket.send(
                    JSON.stringify({
                        type: "call:ended",
                        call_id: callId,
                        reason: "USER_FORCE_LOGOUT"
                    })
                );
            }

            activeCalls.delete(callId);
        }
    }

    /*
     * 通知前端：被強制登出
     */

    if (targetSocket.readyState === 1) {

        targetSocket.send(
            JSON.stringify({
                type: "auth:force-logout",
                reason: "FORCE_LOGOUT"
            })
        );

        targetSocket.close();
    }

    onlineUsers.delete(targetUserId);

    console.log(
        "[Force Logout]:",
        username
    );

    return res.json({
        success: true,
        username,
        user_id: targetUserId
    });
});

wss.on("connection", (socket) => {

    console.log(
        "[WebSocket] Client connected"
    );

    let authenticated = false;

    socket.on("message", async (message) => {

        try {

            const data =
                JSON.parse(
                    message.toString()
                );
            console.log("[WebSocket] Received:", data);

            if (
                data.type === "auth"
            ) {

                if (authenticated) {
                    return;
                }

                const user =
                    await authenticateWebSocketToken(
                        data.token
                    );

                socket.user = user;
                authenticated = true;

                onlineUsers.set(
                    user.user_id,
                    socket
                );

                socket.send(
                    JSON.stringify({
                        type: "auth:success",
                        user: {
                            user_id: user.user_id,
                            username: user.username,
                            role_id: user.role_id,
                            access_context:
                                user.access_context,
                            personnel_id:
                                user.personnel_id
                        }
                    })
                );

                console.log(
                    "[WebSocket] Authenticated:",
                    user.username
                );

                return;
            }

            if (!authenticated) {

                socket.send(
                    JSON.stringify({
                        type: "auth:error",
                        message:
                            "Authentication required"
                    })
                );

                socket.close();

                return;
            }

            if (data.type === "online:list") {

                const users = [];

                for (const [
                    userId,
                    userSocket
                ] of onlineUsers.entries()) {

                    if (
                        userSocket.readyState !== 1 ||
                        !userSocket.user
                    ) {
                        continue;
                    }

                    users.push({
                        user_id:
                            userSocket.user.user_id,

                        username:
                            userSocket.user.username,

                        role_id:
                            userSocket.user.role_id,

                        access_context:
                            userSocket.user.access_context,

                        personnel_id:
                            userSocket.user.personnel_id
                    });
                }

                socket.send(
                    JSON.stringify({
                        type: "online:list",
                        users
                    })
                );

                return;
            }

            if (data.type === "call") {

                const targetUserId =
                    data.target_user_id;

                const targetSocket =
                    onlineUsers.get(targetUserId);

                // 目標不在線
                if (
                    !targetSocket ||
                    targetSocket.readyState !== 1 ||
                    !targetSocket.user
                ) {

                    socket.send(
                        JSON.stringify({
                            type: "call:error",
                            reason: "TARGET_OFFLINE"
                        })
                    );

                    return;
                }

                // 權限檢查
                const permission =
                    canCall(
                        socket.user,
                        targetSocket.user
                    );

                if (!permission.allowed) {

                    socket.send(
                        JSON.stringify({
                            type: "call:error",
                            reason: permission.reason
                        })
                    );

                    console.log(
                        "[Call] DENY:",
                        socket.user.username,
                        "->",
                        targetSocket.user.username,
                        permission.reason
                    );

                    return;
                }

                // 建立這一通電話的唯一 ID
                const callId =
                    crypto.randomUUID();

                activeCalls.set(callId, {
                    callerUserId: socket.user.user_id,
                    targetUserId: targetSocket.user.user_id
                });

                // 傳送來電通知
                targetSocket.send(
                    JSON.stringify({
                        type: "call:incoming",

                        call_id: callId,

                        caller: {
                            user_id:
                                socket.user.user_id,

                            username:
                                socket.user.username,

                            role_id:
                                socket.user.role_id,

                            access_context:
                                socket.user.access_context,

                            personnel_id:
                                socket.user.personnel_id
                        }
                    })
                );

                console.log(
                    "[Call] ALLOW:",
                    socket.user.username,
                    "->",
                    targetSocket.user.username,
                    "| call_id:",
                    callId
                );

                return;
            }

            if (data.type === "call:accept") {

                const callId =
                    data.call_id;

                const call =
                    activeCalls.get(callId);

                // 找不到這通電話
                if (!call) {

                    socket.send(
                        JSON.stringify({
                            type: "call:error",
                            reason: "CALL_NOT_FOUND"
                        })
                    );

                    return;
                }

                // 只有被叫方可以接受
                if (
                    socket.user.user_id !==
                    call.targetUserId
                ) {

                    socket.send(
                        JSON.stringify({
                            type: "call:error",
                            reason: "NOT_CALL_TARGET"
                        })
                    );

                    return;
                }

                const callerSocket =
                    onlineUsers.get(
                        call.callerUserId
                    );

                // 呼叫方已離線
                if (
                    !callerSocket ||
                    callerSocket.readyState !== 1 ||
                    !callerSocket.user
                ) {

                    activeCalls.delete(callId);

                    socket.send(
                        JSON.stringify({
                            type: "call:error",
                            reason: "CALLER_OFFLINE"
                        })
                    );

                    return;
                }

                // 通知呼叫方：對方已接受
                callerSocket.send(
                    JSON.stringify({
                        type: "call:accepted",
                        call_id: callId
                    })
                );

                console.log(
                    "[Call] ACCEPT:",
                    socket.user.username,
                    "accepted call from",
                    callerSocket.user.username,
                    "| call_id:",
                    callId
                );

                return;
            }

            if (data.type === "call:reject") {

                const callId =
                    data.call_id;

                const call =
                    activeCalls.get(callId);

                if (!call) {

                    socket.send(
                        JSON.stringify({
                            type: "call:error",
                            reason: "CALL_NOT_FOUND"
                        })
                    );

                    return;
                }

                // 只有被叫方可以拒絕
                if (
                    socket.user.user_id !==
                    call.targetUserId
                ) {

                    socket.send(
                        JSON.stringify({
                            type: "call:error",
                            reason: "NOT_CALL_TARGET"
                        })
                    );

                    return;
                }

                const callerSocket =
                    onlineUsers.get(
                        call.callerUserId
                    );

                if (
                    callerSocket &&
                    callerSocket.readyState === 1 &&
                    callerSocket.user
                ) {

                    callerSocket.send(
                        JSON.stringify({
                            type: "call:rejected",
                            call_id: callId
                        })
                    );
                }

                activeCalls.delete(callId);

                console.log(
                    "[Call] REJECT:",
                    socket.user.username,
                    "rejected call from",
                    callerSocket?.user?.username || "offline",
                    "| call_id:",
                    callId
                );

                return;
            }
            if (data.type === "call:hangup") {

                const callId =
                    data.call_id;

                const call =
                    activeCalls.get(callId);

                if (!call) {

                    socket.send(
                        JSON.stringify({
                            type: "call:error",
                            reason: "CALL_NOT_FOUND"
                        })
                    );

                    return;
                }

                // 必須是這通電話的其中一方
                const isParticipant =
                    socket.user.user_id === call.callerUserId ||
                    socket.user.user_id === call.targetUserId;

                if (!isParticipant) {

                    socket.send(
                        JSON.stringify({
                            type: "call:error",
                            reason: "NOT_CALL_PARTICIPANT"
                        })
                    );

                    return;
                }

                const otherUserId =
                    socket.user.user_id === call.callerUserId
                        ? call.targetUserId
                        : call.callerUserId;

                const otherSocket =
                    onlineUsers.get(otherUserId);

                if (
                    otherSocket &&
                    otherSocket.readyState === 1 &&
                    otherSocket.user
                ) {

                    otherSocket.send(
                        JSON.stringify({
                            type: "call:ended",
                            call_id: callId
                        })
                    );
                }

                activeCalls.delete(callId);

                console.log(
                    "[Call] END:",
                    socket.user.username,
                    "| call_id:",
                    callId
                );

                return;
            }

        } catch (error) {

            console.error(
                "[WebSocket] Message Error:",
                error.message
            );

            socket.send(
                JSON.stringify({
                    type: "auth:error",
                    message:
                        error.message ||
                        "Authentication failed"
                })
            );

            socket.close();

        }

    });

    socket.on("close", () => {

        if (socket.user?.user_id) {

            onlineUsers.delete(
                socket.user.user_id
            );

            console.log(
                "[WebSocket] Removed online user:",
                socket.user.username
            );
        }

        console.log(
            "[WebSocket] Client disconnected"
        );

    });

    socket.on("error", (error) => {

        console.error(
            "[WebSocket] Error:",
            error
        );

    });

});

// ========================================
// Start Server
// ========================================

server.listen(PORT, () => {

    console.log(
        `🚀Server running on port ${PORT}`
    );

    console.log(
        `WebSocket running on /ws`
    );

});