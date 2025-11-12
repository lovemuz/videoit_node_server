const CHAT_TYPE: {
    CHAT_NORMAL: number,
    CHAT_IMAGE: number,
    CHAT_FILE: number,
    CHAT_LINK: number,
    CHAT_VIDEO: number,
    CHAT_ALERT: number,
    CHAT_GIFT: number,
    CHAT_SUBSCRIBE: number,
} = (function () {
    return {
        CHAT_NORMAL: 0,
        CHAT_IMAGE: 1,
        CHAT_FILE: 2,
        CHAT_LINK: 3,
        CHAT_VIDEO: 4,
        CHAT_ALERT: 5,
        CHAT_GIFT: 6,
        CHAT_SUBSCRIBE: 7,
    }
}())

const CHAT_ALL_TYPE: {
    FOLLOW: string,
    ALL: string,
    SUBSCRIBE: string,
} = (function () {
    return {
        FOLLOW: 'follow',
        ALL: 'all',
        SUBSCRIBE: 'subscribe',
    }
}())

export {
    CHAT_TYPE,
    CHAT_ALL_TYPE
}