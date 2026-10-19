window.ShuttleCallAudio = (() => {
    const AUDIO_ID = "shuttle-remote-audio";

    function playRemoteStream(stream) {
        if (!stream) {
            console.warn("[CallAudio] Remote stream 不存在");
            return;
        }

        let audio = document.getElementById(AUDIO_ID);

        if (!audio) {
            audio = document.createElement("audio");
            audio.id = AUDIO_ID;
            audio.autoplay = true;
            audio.playsInline = true;
            audio.style.display = "none";
            document.body.appendChild(audio);
        }

        if (audio.srcObject !== stream) {
            audio.srcObject = stream;
        }

        const result = audio.play();

        if (result && typeof result.catch === "function") {
            result.catch(error => {
                console.warn("[CallAudio] 遠端音訊播放失敗：", error);
            });
        }
    }

    function stopRemoteStream() {
        const audio = document.getElementById(AUDIO_ID);

        if (!audio) return;

        audio.pause();
        audio.srcObject = null;
        audio.remove();
    }

    return {
        playRemoteStream,
        stopRemoteStream
    };
})();
