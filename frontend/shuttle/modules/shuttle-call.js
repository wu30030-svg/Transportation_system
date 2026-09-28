// ============================================================
// Shuttle Call Module
// 接駁車通話狀態與計時
// ============================================================

window.ShuttleCall = (() => {

    // ========================================
    // Call State
    // ========================================

    let activeCallId = null;

    let activeCallTarget = null;

    let activeCallState = null;

    let callStartedAt = null;

    let callTimer = null;


    // ========================================
    // State
    // ========================================

    function getState() {

        return {
            activeCallId,
            activeCallTarget,
            activeCallState,
            callStartedAt
        };
    }


    function setCall({
        callId,
        target,
        state
    }) {

        activeCallId =
            callId || null;

        activeCallTarget =
            target || null;

        activeCallState =
            state || null;

        callStartedAt =
            null;
    }


    function setState(state) {

        activeCallState =
            state;
    }


    function setStarted() {

        callStartedAt =
            Date.now();
    }


    function clearCall() {

        stopTimer();

        activeCallId =
            null;

        activeCallTarget =
            null;

        activeCallState =
            null;

        callStartedAt =
            null;
    }


    // ========================================
    // Timer
    // ========================================

    function startTimer() {

        stopTimer();


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


    function stopTimer() {

        if (!callTimer) {
            return;
        }


        clearInterval(
            callTimer
        );


        callTimer =
            null;
    }


    return {

        getState,

        setCall,

        setState,

        setStarted,

        clearCall,

        startTimer,

        stopTimer

    };

})();