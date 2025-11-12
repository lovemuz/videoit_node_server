const COUNTRY_LIST: {
    인도: string,
    프랑스: string,
    스페인: string,
    중국: string,//(간체)
    일본: string,
    한국: string,
    미국: string,
} = (function () {
    return {
        인도: 'id',
        프랑스: 'fr',
        스페인: 'es',
        중국: 'zh',//(간체)
        일본: 'ja',
        한국: 'ko',
        미국: 'en',
    }
}())

export {
    COUNTRY_LIST,
}