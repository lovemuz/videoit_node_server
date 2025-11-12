
const DECLARATION_TYPE: {
    DECLARATION_CALL: number,
    DECLARATION_USER: number,
    DECLARATION_POST: number,
    DECLARATION_CHAT: number,
} = (function () {
    return {
        DECLARATION_CALL: 0,
        DECLARATION_USER: 1,
        DECLARATION_POST: 2,
        DECLARATION_CHAT: 3,
    }
}())

export {
    DECLARATION_TYPE,
}