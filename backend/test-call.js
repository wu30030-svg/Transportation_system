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

    const data = JSON.parse(message.toString());

    console.log(`[${role}] <=`, data);

});

process.stdin.on("data", (input) => {

    const command = input.toString().trim();

    if (command.startsWith("call ")) {

        const targetUserId = command.substring(5).trim();

        const payload = {
            type: "call",
            target_user_id: targetUserId
        };

        console.log(
            `[${role}] SEND ->`,
            JSON.stringify(payload)
        );

        console.log(
            `[${role}] WebSocket state =`,
            ws.readyState
        );

        ws.send(JSON.stringify(payload), (error) => {

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

        });
    }
    if (command.startsWith("accept ")) {

        const callId =
            command.substring(7).trim();

        const payload = {
            type: "call:accept",
            call_id: callId
        };

        console.log(
            `[${role}] SEND ->`,
            JSON.stringify(payload)
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
    if (command.startsWith("reject ")) {

        const callId =
            command.substring(7).trim();

        const payload = {
            type: "call:reject",
            call_id: callId
        };

        console.log(
            `[${role}] SEND ->`,
            JSON.stringify(payload)
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
    if (command.startsWith("hangup ")) {

        const callId =
            command.substring(7).trim();

        const payload = {
            type: "call:hangup",
            call_id: callId
        };

        console.log(
            `[${role}] SEND ->`,
            JSON.stringify(payload)
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

});

ws.on("error", (error) => {

    console.error(
        `[${role}] WebSocket Error:`,
        error.message
    );

});

ws.on("close", () => {

    console.log(`[${role}] WebSocket closed`);

});