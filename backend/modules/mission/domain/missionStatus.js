const MISSION_STATUS = Object.freeze({
    DRAFT: "DRAFT",
    PLANNED: "PLANNED",
    READY: "READY",
    RUNNING: "RUNNING",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    ABORTED: "ABORTED"
});


// 定義合法的狀態轉換
const STATUS_TRANSITIONS = Object.freeze({
    DRAFT: [
        MISSION_STATUS.PLANNED,
        MISSION_STATUS.CANCELLED
    ],

    PLANNED: [
        MISSION_STATUS.READY,
        MISSION_STATUS.CANCELLED
    ],

    READY: [
        MISSION_STATUS.RUNNING,
        MISSION_STATUS.CANCELLED
    ],

    RUNNING: [
        MISSION_STATUS.COMPLETED,
        MISSION_STATUS.ABORTED
    ],

    COMPLETED: [],

    CANCELLED: [],

    ABORTED: []
});


// 判斷狀態轉換是否合法
function canTransition(fromStatus, toStatus) {
    const allowedTransitions = STATUS_TRANSITIONS[fromStatus];

    if (!allowedTransitions) {
        return false;
    }

    return allowedTransitions.includes(toStatus);
}


module.exports = {
    MISSION_STATUS,
    STATUS_TRANSITIONS,
    canTransition
};