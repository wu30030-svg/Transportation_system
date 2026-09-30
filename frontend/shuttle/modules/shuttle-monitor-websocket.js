window.ShuttleMonitorWebSocket = (() => {

    let webSocket = null;

    let onMessage = null;
    let onOpen = null;
    let onClose = null;
    let onError = null;

    function connect({
        url,
        token,
        messageHandler,
        openHandler,
        closeHandler,
        errorHandler
    }) {

        if (!token) {

            console.error(
                "[Shuttle Monitor WebSocket] 沒有登入 Token"
            );

            return;
        }

        if (
            webSocket &&
            (
                webSocket.readyState ===
                WebSocket.OPEN ||

                webSocket.readyState ===
                WebSocket.CONNECTING
            )
        ) {

            return;
        }

        onMessage =
            messageHandler;

        onOpen =
            openHandler;

        onClose =
            closeHandler;

        onError =
            errorHandler;

        console.log(
            "[Shuttle Monitor WebSocket] Connecting:",
            url
        );

        webSocket =
            new WebSocket(url);


        webSocket.addEventListener(
            "open",
            () => {

                console.log(
                    "[Shuttle Monitor WebSocket] Connected"
                );

                webSocket.send(
                    JSON.stringify({
                        type: "auth",
                        token
                    })
                );

                if (
                    typeof onOpen ===
                    "function"
                ) {

                    onOpen();

                }

            }
        );


        webSocket.addEventListener(
            "message",
            event => {

                try {

                    const data =
                        JSON.parse(
                            event.data
                        );

                    console.log(
                        "[Shuttle Monitor WebSocket] <= ",
                        data
                    );

                    if (
                        typeof onMessage ===
                        "function"
                    ) {

                        onMessage(data);

                    }

                } catch (error) {

                    console.error(
                        "[Shuttle Monitor WebSocket] 訊息解析失敗:",
                        error
                    );

                }

            }
        );


        webSocket.addEventListener(
            "error",
            error => {

                console.error(
                    "[Shuttle Monitor WebSocket] Error:",
                    error
                );

                if (
                    typeof onError ===
                    "function"
                ) {

                    onError(error);

                }

            }
        );


        webSocket.addEventListener(
            "close",
            () => {

                console.log(
                    "[Shuttle Monitor WebSocket] Closed"
                );

                webSocket = null;

                if (
                    typeof onClose ===
                    "function"
                ) {

                    onClose();

                }

            }
        );

    }


    function send(data) {

        if (
            !webSocket ||
            webSocket.readyState !==
            WebSocket.OPEN
        ) {

            console.warn(
                "[Shuttle Monitor WebSocket] WebSocket 尚未連線"
            );

            return false;
        }

        webSocket.send(
            JSON.stringify(data)
        );

        return true;
    }


    function isConnected() {

        return !!(
            webSocket &&
            webSocket.readyState ===
            WebSocket.OPEN
        );

    }


    function close() {

        if (!webSocket) {
            return;
        }

        webSocket.close();

        webSocket = null;

    }


    function getSocket() {

        return webSocket;

    }


    return {
        connect,
        send,
        isConnected,
        close,
        getSocket
    };

})();