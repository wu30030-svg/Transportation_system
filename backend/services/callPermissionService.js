
function canCall(caller, target) {
    if (!caller || !target) {
        return {
            allowed: false,
            reason: "INVALID_USER"
        };
    }

    const callerRole = Number(caller.role_id);
    const targetRole = Number(target.role_id);

    // 僅允許駕駛（4）與監控（6）互相呼叫。
    const allowedRoles =
        (callerRole === 4 && targetRole === 6) ||
        (callerRole === 6 && targetRole === 4);

    if (!allowedRoles) {
        return {
            allowed: false,
            reason: "CALLER_OR_TARGET_NOT_ALLOWED"
        };
    }

    // 雙方必須有相同且有效的路線工作區。
    const validRoutePattern = /^營區開放_[A-E]路線$/;

    if (
        typeof caller.access_context !== "string" ||
        typeof target.access_context !== "string" ||
        !validRoutePattern.test(caller.access_context) ||
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
