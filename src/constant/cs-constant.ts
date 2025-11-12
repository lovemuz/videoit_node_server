const CHAT_CS_TYPE: {
    REFUND: number,
    PAYMENT: number,
    EXCHANGE: number,
    ERROR: number,
    USE: number,
} = (function () {
    return {
        REFUND: 0,
        PAYMENT: 1,
        EXCHANGE: 2,
        ERROR: 3,
        USE: 4,
    }
}())

export {
    CHAT_CS_TYPE,
}