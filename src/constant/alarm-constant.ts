const ALARM_TYPE: {
    ALARM_POST: number,
    ALARM_GIFT: number,
    ALARM_NOTIFICATION: number,
    ALARM_SUBSCRIBE: number,
} = (function () {
    return {
        ALARM_POST: 1,
        ALARM_GIFT: 2,
        ALARM_NOTIFICATION: 3,
        ALARM_SUBSCRIBE: 4,
    }
}())

export {
    ALARM_TYPE,
}