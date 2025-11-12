const EXCHANGE_STATE: {
    EXCHANGE_WAIT: number,
    EXCHANGE_SUCCESS: number,
    EXCHANGE_FAIL: number,
} = (function () {
    return {
        EXCHANGE_WAIT: 0,
        EXCHANGE_SUCCESS: 1,
        EXCHANGE_FAIL: 2,
    }
}())
const EXCHANGE_TYPE: {
    EXCHANGE_POINT: number;
    EXCHANGE_MONEY: number;
} = (function () {
    return {
        EXCHANGE_POINT: 1,
        EXCHANGE_MONEY: 2,
    }
}())

const EXCHANGE_RATE: {
    RATE_DEFALUT: number
    RATE_RARE: number
} = (function () {
    return {
        RATE_DEFALUT: 0.4,//40%
        RATE_RARE: 0.6, //60%
    }
}())

export {
    EXCHANGE_TYPE,
    EXCHANGE_STATE,
    EXCHANGE_RATE
}