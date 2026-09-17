function canCall(caller, target) {

    if (!caller || !target) {
        return {
            allowed: false,
            reason: "INVALID_USER"
        };
    }

    // 只有高階監控可以主動發起呼叫
    if (Number(caller.role_id) !== 6) {
        return {
            allowed: false,
            reason: "CALLER_NOT_ALLOWED"
        };
    }

    // 目標必須是駕駛
    if (Number(target.role_id) !== 4) {
        return {
            allowed: false,
            reason: "TARGET_NOT_ALLOWED"
        };
    }

    // 必須存在相同的管理範圍
    if (
        !caller.access_context ||
        !target.access_context ||
        caller.access_context !== target.access_context
    ) {
        return {
            allowed: false,
            reason: "ACCESS_CONTEXT_MISMATCH"
        };
    }

    return {
        allowed: true,
        reason: "ALLOWED"
    };
}

module.exports = {
    canCall
};
