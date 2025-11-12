const CONTAINER_TYPE: {
    CONTAINER_NORMAL: number,
    CONTAINER_IMAGE: number,
    CONTAINER_VIDEO: number,
} = (function () {
    return {
        CONTAINER_NORMAL: 0,
        CONTAINER_IMAGE: 1,
        CONTAINER_VIDEO: 4,
    }
}())

export {
    CONTAINER_TYPE,
}