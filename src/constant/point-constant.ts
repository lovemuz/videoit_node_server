const POINT_LIST: {
    POINT_4000: number,
    POINT_8000: number,
    POINT_15000: number,
    POINT_30000: number,
    POINT_60000: number,
    POINT_100000: number,
    POINT_200000: number,
    POINT_300000: number,
} = (function () {
    return {
        POINT_4000: 8000,
        POINT_8000: 14500,
        POINT_15000: 25000,
        POINT_30000: 48000,
        POINT_60000: 96000,
        POINT_100000: 160000,
        POINT_200000: 320000,
        POINT_300000: 480000,
    }
}())

const POINT_PRODUCTID: {
    PRODUCTID_4000: string,
    PRODUCTID_8000: string,
    PRODUCTID_15000: string,
    PRODUCTID_30000: string,
    PRODUCTID_60000: string,
    PRODUCTID_100000: string,
    PRODUCTID_200000: string,
    PRODUCTID_300000: string,
} = (function () {
    return {
        PRODUCTID_4000: 'nmoment4000',
        PRODUCTID_8000: 'nmoment8000',
        PRODUCTID_15000: 'nmoment15000',
        PRODUCTID_30000: 'nmoment30000',
        PRODUCTID_60000: 'nmoment60000',
        PRODUCTID_100000: 'nmoment100000',
        PRODUCTID_200000: 'nmoment200000',
        PRODUCTID_300000: 'nmoment300000',
    }
}())

const POINT_LIST_WEB: {
    POINT_4000: number;
    POINT_10000: number;
    POINT_20000: number;
    POINT_40000: number;
    POINT_80000: number;
    POINT_160000: number;
    POINT_200000: number;
    POINT_400000: number;
    POINT_700000: number;
} = (function () {
    return {
        POINT_4000: 7000,
        POINT_10000: 14000,
        POINT_20000: 28000,
        POINT_40000: 56000,
        POINT_80000: 112000,
        POINT_160000: 224000,
        POINT_200000: 280000,
        POINT_400000: 560000,
        POINT_700000: 980000,
    };
})();


const POINT_HISTORY: {
    TYPE_CALL: number,
    TYPE_CHAT: number,
    TYPE_ATTENDANCE: number,
    TYPE_GIFT: number,
    TYPE_EXCHANGE: number,
    TYPE_POST: number,
    TYPE_PAYMENT: number,
    PLUS: boolean,
    MINUS: boolean,
} = (function () {
    return {
        // 0 영상통화 , 1 채팅 , 2, 출석체크, 3.선물 구매 , 4. 환전 , 5. 게시글 구매 ,6 포인트 구매
        TYPE_CALL: 0,
        TYPE_CHAT: 1,
        TYPE_ATTENDANCE: 2,
        TYPE_GIFT: 3,
        TYPE_EXCHANGE: 4,
        TYPE_POST: 5,
        TYPE_PAYMENT: 6,
        PLUS: true,
        MINUS: false,
    }
}())

const POINT_ATTENDANCE: {
    DEFAULT: number,
    GIRL: number,
    BOY: number,
    SUBSCRIBE: number,
} = (function () {
    return {
        DEFAULT: 10,
        GIRL: 10,
        BOY: 10,
        SUBSCRIBE: 1000,
    }
}())

export {
    POINT_PRODUCTID,
    POINT_LIST,
    POINT_HISTORY,
    POINT_ATTENDANCE,
    POINT_LIST_WEB
}