const WebSocket = require("ws");

const role = process.argv[2];
const token = process.argv[3];

if (!role || !token) {
    console.error("Usage:");
    console.error("node backend/test-call.js monitor <JWT>");
    console.error("node backend/test-call.js driver <JWT>");
    process.exit(1);
}

const ws = new WebSocket("ws://localhost:3000/ws");

ws.on("open", () => {

    console.log(`[${role}] WebSocket connected`);

    ws.send(JSON.stringify({
        type: "auth",
        token
    }));

});

ws.on("message", (message) => {

    const data =
        JSON.parse(
            message.toString()
        );

    console.log(
        `[${role}] <=`,
        data
    );

});

function sendPayload(payload) {

    console.log(
        `[${role}] SEND ->`,
        JSON.stringify(payload)
    );

    console.log(
        `[${role}] WebSocket state =`,
        ws.readyState
    );

    ws.send(
        JSON.stringify(payload),
        (error) => {

            if (error) {

                console.error(
                    `[${role}] SEND ERROR:`,
                    error.message
                );

                return;
            }

            console.log(
                `[${role}] SEND SUCCESS`
            );

        }
    );
}

process.stdin.on("data", (input) => {

    const command =
        input.toString().trim();

    // ========================================
    // Call
    // ========================================

    if (command.startsWith("call ")) {

        const targetUserId =
            command
                .substring(5)
                .trim();

        sendPayload({
            type: "call",
            target_user_id: targetUserId
        });

        return;
    }

    // ========================================
    // Accept
    // ========================================

    if (command.startsWith("accept ")) {

        const callId =
            command
                .substring(7)
                .trim();

        sendPayload({
            type: "call:accept",
            call_id: callId
        });

        return;
    }

    // ========================================
    // Reject
    // ========================================

    if (command.startsWith("reject ")) {

        const callId =
            command
                .substring(7)
                .trim();

        sendPayload({
            type: "call:reject",
            call_id: callId
        });

        return;
    }

    // ========================================
    // Hangup
    // ========================================

    if (command.startsWith("hangup ")) {

        const callId =
            command
                .substring(7)
                .trim();

        sendPayload({
            type: "call:hangup",
            call_id: callId
        });

        return;
    }

    // ========================================
    // WebRTC Offer
    // ========================================

    if (command.startsWith("offer ")) {

        const callId =
            command
                .substring(6, command.indexOf(" ", 6))
                .trim();

        const offerJson =
            command
                .substring(
                    command.indexOf(" ", 6) + 1
                )
                .trim();

        let offer;

        try {

            offer =
                JSON.parse(
                    offerJson
                );

        } catch (error) {

            console.error(
                `[${role}] Invalid offer JSON`
            );

            return;
        }

        sendPayload({
            type: "call:webrtc-offer",
            call_id: callId,
            offer
        });

        return;
    }

    // ========================================
    // WebRTC Answer
    // ========================================

    if (command.startsWith("answer ")) {

        const callId =
            command
                .substring(7, command.indexOf(" ", 7))
                .trim();

        const answerJson =
            command
                .substring(
                    command.indexOf(" ", 7) + 1
                )
                .trim();

        let answer;

        try {

            answer =
                JSON.parse(
                    answerJson
                );

        } catch (error) {

            console.error(
                `[${role}] Invalid answer JSON`
            );

            return;
        }

        sendPayload({
            type: "call:webrtc-answer",
            call_id: callId,
            answer
        });

        return;
    }

    // ========================================
    // WebRTC ICE Candidate
    // ========================================

    if (command.startsWith("ice ")) {

        const callId =
            command
                .substring(4, command.indexOf(" ", 4))
                .trim();

        const candidateJson =
            command
                .substring(
                    command.indexOf(" ", 4) + 1
                )
                .trim();

        let candidate;

        try {

            candidate =
                JSON.parse(
                    candidateJson
                );

        } catch (error) {

            console.error(
                `[${role}] Invalid ICE candidate JSON`
            );

            return;
        }

        sendPayload({
            type: "call:webrtc-ice",
            call_id: callId,
            candidate
        });

        return;
    }

    console.log(
        `[${role}] Unknown command:`,
        command
    );

});

ws.on("error", (error) => {

    console.error(
        `[${role}] WebSocket Error:`,
        error.message
    );

});

ws.on("close", () => {

    console.log(
        `[${role}] WebSocket closed`
    );

});