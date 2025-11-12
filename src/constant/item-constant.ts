const ITEM_LIST: {
    ITEM_CANDY: {
        code: string,
        price: number,
    },
    ITEM_ROSE: {
        code: string,
        price: number,
    },
    ITEM_CAKE: {
        code: string,
        price: number,
    },
    ITEM_RING: {
        code: string,
        price: number,
    },
    ITEM_CROWN: {
        code: string,
        price: number,
    },
    ITEM_HEART: {
        code: string,
        price: number,
    },
} = (function () {
    return {
        ITEM_CANDY: {
            code: 'candy',
            price: 100,
        },
        ITEM_ROSE: {
            code: 'rose',
            price: 300,
        },
        ITEM_CAKE: {
            code: 'cake',
            price: 1000,
        },
        ITEM_RING: {
            code: 'ring',
            price: 3000,
        },
        ITEM_CROWN: {
            code: 'crown',
            price: 9000,
        },
        ITEM_HEART: {
            code: 'heart',
            price: 18000,
        },
    }
}())

export {
    ITEM_LIST,
}