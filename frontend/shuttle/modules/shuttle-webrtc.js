// ============================================================
// Shuttle WebRTC Module
// 共用 WebRTC 邏輯
// ============================================================

window.ShuttleWebRTC = (() => {

    let peerConnection = null;
    let localStream = null;
    let remoteStream = null;
    let pendingIceCandidates = [];

    function createPeerConnection({
        role,
        webSocket,
        callId,
        onRemoteStream
    }) {
        const logPrefix =
            role === "monitor"
                ? "[WebRTC] Monitor"
                : "[WebRTC] Driver";

        peerConnection = new RTCPeerConnection();

        console.log(`${logPrefix} PeerConnection 已建立`);

        peerConnection.onicecandidate = (event) => {
            if (!event.candidate) {
                return;
            }

            if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
                console.warn(`${logPrefix} WebSocket 尚未連線，無法傳送 ICE`);
                return;
            }

            webSocket.send(JSON.stringify({
                type: "call:webrtc-ice",
                call_id: callId,
                candidate: event.candidate
            }));

            console.log(`${logPrefix} ICE Candidate 已送出`);
        };

        peerConnection.onconnectionstatechange = () => {
            console.log(
                `${logPrefix} Connection State:`,
                peerConnection.connectionState
            );
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log(
                `${logPrefix} ICE Connection State:`,
                peerConnection.iceConnectionState
            );
        };

        peerConnection.ontrack = (event) => {
            console.log(`${logPrefix} 收到 Remote Track`);

            if (!remoteStream) {
                remoteStream = new MediaStream();
            }

            event.streams[0]?.getTracks().forEach((track) => {
                remoteStream.addTrack(track);
            });

            if (typeof onRemoteStream === "function") {
                onRemoteStream(remoteStream);
            }
        };

        return peerConnection;
    }

    async function getLocalAudioStream() {
        if (localStream) {
            return localStream;
        }

        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });

        console.log("[WebRTC] Local Audio Stream 已取得");

        return localStream;
    }

    async function startAsCaller({
        webSocket,
        callId,
        onRemoteStream
    }) {
        const pc = createPeerConnection({
            role: "monitor",
            webSocket,
            callId,
            onRemoteStream
        });

        const stream = await getLocalAudioStream();

        stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
        });

        console.log("[WebRTC] Monitor Local Audio Track 已加入");

        const offer = await pc.createOffer();

        await pc.setLocalDescription(offer);

        webSocket.send(JSON.stringify({
            type: "call:webrtc-offer",
            call_id: callId,
            offer: pc.localDescription
        }));

        console.log("[WebRTC] Monitor WebRTC Offer 已送出");
    }

    async function handleOffer({
        webSocket,
        callId,
        offer,
        onRemoteStream
    }) {
        const pc = createPeerConnection({
            role: "driver",
            webSocket,
            callId,
            onRemoteStream
        });

        const stream = await getLocalAudioStream();

        stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
        });

        console.log("[WebRTC] Driver Local Audio Track 已加入");

        await pc.setRemoteDescription(
            new RTCSessionDescription(offer)
        );

        console.log("[WebRTC] Driver Remote Description 已設定");

        for (const candidate of pendingIceCandidates) {
            try {
                await pc.addIceCandidate(candidate);
                console.log("[WebRTC] Driver Pending ICE 已加入");
            } catch (error) {
                console.error(
                    "[WebRTC] Driver Pending ICE 加入失敗:",
                    error
                );
            }
        }

        pendingIceCandidates = [];

        const answer = await pc.createAnswer();

        await pc.setLocalDescription(answer);

        webSocket.send(JSON.stringify({
            type: "call:webrtc-answer",
            call_id: callId,
            answer: pc.localDescription
        }));

        console.log("[WebRTC] Driver WebRTC Answer 已送出");
    }

    async function handleAnswer(answer) {
        if (!peerConnection) {
            console.warn(
                "[WebRTC] 收到 Answer，但 PeerConnection 不存在"
            );
            return;
        }

        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
        );

        console.log("[WebRTC] Monitor Remote Description 已設定");

        for (const candidate of pendingIceCandidates) {
            try {
                await peerConnection.addIceCandidate(candidate);
                console.log("[WebRTC] Monitor Pending ICE 已加入");
            } catch (error) {
                console.error(
                    "[WebRTC] Monitor Pending ICE 加入失敗:",
                    error
                );
            }
        }

        pendingIceCandidates = [];
    }

    async function handleIceCandidate(candidate) {
        if (!candidate) {
            return;
        }

        if (
            !peerConnection ||
            !peerConnection.remoteDescription
        ) {
            pendingIceCandidates.push(candidate);

            console.log(
                "[WebRTC] ICE Candidate 暫存，等待 Remote Description"
            );

            return;
        }

        try {
            await peerConnection.addIceCandidate(candidate);

            console.log("[WebRTC] ICE Candidate 已加入");
        } catch (error) {
            console.error(
                "[WebRTC] ICE Candidate 加入失敗:",
                error
            );
        }
    }

    function cleanup() {

        if (localStream) {

            localStream.getTracks().forEach((track) => {
                track.stop();
            });

            localStream = null;

            console.log(
                "[WebRTC] Local Audio Stream 已清除"
            );
        }


        if (peerConnection) {

            peerConnection.close();
            peerConnection = null;

            console.log(
                "[WebRTC] PeerConnection 已關閉"
            );
        }


        if (remoteStream) {

            remoteStream.getTracks().forEach((track) => {
                track.stop();
            });

            remoteStream = null;

            console.log(
                "[WebRTC] Remote MediaStream 已清除"
            );
        }


        const audioElement =
            document.getElementById(
                "shuttle-remote-audio"
            );

        if (audioElement) {

            audioElement.pause();

            audioElement.srcObject =
                null;

            audioElement.remove();

            console.log(
                "[WebRTC] Remote Audio Element 已移除"
            );
        }


        pendingIceCandidates = [];

        console.log(
            "[WebRTC] Pending ICE Candidates 已清除"
        );
    }

    return {
        startAsCaller,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        cleanup
    };
})();