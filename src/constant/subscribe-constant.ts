const SUBSCRIBE_STATE: {
    ING: Boolean,
    CANCEL: Boolean,
} = (function () {
    return {
        ING: true,
        CANCEL: false,
    }
}())

export {
    SUBSCRIBE_STATE,
}